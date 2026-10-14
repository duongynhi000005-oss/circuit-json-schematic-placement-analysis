import { BaseSolver } from "@tscircuit/solver-utils"
import type {
  LcFilterComponentsNotGrouped,
  SchematicPlacementIssue,
} from "../../types"
import { addAttr } from "../../utils/format"
import { PlacementNetworkIndex } from "../../utils/placement-network-index"
import type { SolverContext } from "../SolverContext"

/** Group a local series inductor with its one-sided grounded capacitor bank. */
export class LcFilterGroupingSolver extends BaseSolver {
  private readonly index: PlacementNetworkIndex
  private readonly inductorIds: string[]
  private readonly unpopulated = new Set<string>()
  private currentIndex = 0

  constructor(
    private readonly params: {
      ctx: SolverContext
      issues: SchematicPlacementIssue[]
    },
  ) {
    super()
    this.index = new PlacementNetworkIndex(params.ctx)
    for (const e of params.ctx.circuitJson) {
      if (e.type === "pcb_component" && e.do_not_place)
        this.unpopulated.add(e.source_component_id)
      if (e.type === "source_port" && (e.requires_ground || e.provides_ground))
        this.index.groundNets.add(this.index.connected(e.source_port_id))
    }
    for (const e of params.ctx.circuitJson)
      if (e.type === "pcb_component" && !e.do_not_place)
        this.unpopulated.delete(e.source_component_id)
    this.inductorIds = [...this.index.components.values()]
      .filter(
        (c) =>
          c.ftype === "simple_inductor" &&
          !this.unpopulated.has(c.source_component_id),
      )
      .map((c) => c.source_component_id)
    this.solved = this.inductorIds.length === 0
  }

  override _step(): void {
    const id = this.inductorIds[this.currentIndex++]
    this.solved = this.currentIndex >= this.inductorIds.length
    if (!id) return
    const index = this.index
    const inductor = this.localPart(id)
    const nets = index.twoTerminalNets(id)
    if (!inductor || !nets || nets.some((net) => index.groundNets.has(net)))
      return
    const sides = nets.map((net) =>
      (index.portsByNet.get(net) ?? []).filter(
        (p) => !this.unpopulated.has(p.source_component_id),
      ),
    )
    // Parallel inductors and cascaded stages do not have a unique series element.
    if (
      sides.some((peers) =>
        peers.some(
          (p) =>
            p.source_component_id !== id &&
            index.components.get(p.source_component_id)?.ftype ===
              "simple_inductor",
        ),
      )
    )
      return
    if (
      sides.some((peers) =>
        peers.some(
          (p) =>
            index.components.get(p.source_component_id)?.ftype ===
              "simple_capacitor" &&
            !index.twoTerminalNets(p.source_component_id),
        ),
      )
    )
      return
    const capacitors = sides.map((peers) =>
      peers.filter((p) => {
        const component = index.components.get(p.source_component_id)
        const capNets = index.twoTerminalNets(p.source_component_id)
        return (
          component?.ftype === "simple_capacitor" &&
          capNets?.some((net) => index.groundNets.has(net))
        )
      }),
    )
    // Check topology before scope/geometry: a remote or unrendered second bank
    // must not turn a C–L–C network into an apparent one-sided LC stage.
    if (capacitors.filter((bank) => bank.length > 0).length !== 1) return
    const side = capacitors.findIndex((bank) => bank.length > 0)
    const net = nets[side]!
    const bank = capacitors[side]!
    const peers = sides[side]!
    // IC bypass networks and resonant/active loads need their own placement policy.
    // Limit this rule to a local passive stage with optional resistor/connector loads.
    if (
      peers.some((p) => {
        const component = index.components.get(p.source_component_id)
        const placement = index.placement(p.source_component_id)
        return (
          !component ||
          ![
            "simple_inductor",
            "simple_capacitor",
            "simple_resistor",
            "simple_connector",
          ].includes(component.ftype) ||
          !placement ||
          !index.sameLocalScope(inductor.placement, placement)
        )
      })
    )
      return
    const grounds = new Set(
      bank.map((p) =>
        index.twoTerminalNets(p.source_component_id)!.find((n) => n !== net),
      ),
    )
    if (grounds.size !== 1) return
    const parts = bank.map((p) => this.localPart(p.source_component_id))
    if (
      parts.some((part, i) => {
        const component = index.components.get(bank[i]!.source_component_id)
        return (
          !part ||
          !index.sameLocalScope(inductor.placement, part.placement) ||
          component?.ftype !== "simple_capacitor" ||
          !Number.isFinite(component.capacitance) ||
          component.capacitance <= 0
        )
      })
    )
      return
    const capacitorsPlaced = parts.map((p) => p!.placement)
    const seriesPin = index.port(
      inductor.ports.find((p) => index.connected(p.source_port_id) === net)!,
    )!
    const nearestPinDistance = Math.min(
      ...bank.map((p) => {
        const pin = index.port(p)!
        return Math.hypot(
          pin.center.x - seriesPin.center.x,
          pin.center.y - seriesPin.center.y,
        )
      }),
    )
    // Schematic readability allowance, not a PCB layout or electrical limit.
    // Capacitor-to-capacitor spacing is handled by the existing bank analyzer.
    const maxRecommendedPinDistance = Math.max(
      4,
      ...[inductor.placement, ...capacitorsPlaced].map(
        (p) => 3 * Math.max(p.width, p.height),
      ),
    )
    if (nearestPinDistance <= maxRecommendedPinDistance) return
    this.params.issues.push({
      lineItemType: "LcFilterComponentsNotGrouped",
      inductorSchematicBox: inductor.placement,
      capacitorSchematicBoxes: capacitorsPlaced,
      nearestPinDistance,
      maxRecommendedPinDistance,
      message: `Group ${inductor.placement.sourceComponentName || "the inductor"} beside its connected grounded capacitor bank so the LC stage can be read together. Preserve pin connections, allow room for labels, and reroute affected traces.`,
    })
  }

  private localPart(id: string) {
    const placement = this.index.placement(id)
    const ports = this.index.portsByComponent.get(id)
    if (
      !placement ||
      !Number.isFinite(placement.width) ||
      !Number.isFinite(placement.height) ||
      placement.width <= 0 ||
      placement.height <= 0 ||
      ports?.length !== 2 ||
      ports.some((p) => {
        const pin = this.index.port(p)
        return (
          p.do_not_connect ||
          !pin ||
          pin.schematic_sheet_id !== placement.schematicSheetId ||
          !Number.isFinite(pin.center.x) ||
          !Number.isFinite(pin.center.y)
        )
      })
    )
      return
    return { placement, ports }
  }

  static issueToString(issue: LcFilterComponentsNotGrouped): string {
    const attrs: string[] = []
    addAttr(
      attrs,
      "inductorName",
      issue.inductorSchematicBox.sourceComponentName,
    )
    addAttr(
      attrs,
      "capacitorNames",
      issue.capacitorSchematicBoxes
        .map((p) => p.sourceComponentName)
        .join(", "),
    )
    addAttr(attrs, "nearestPinDistance", issue.nearestPinDistance)
    addAttr(attrs, "maxRecommendedPinDistance", issue.maxRecommendedPinDistance)
    addAttr(attrs, "message", issue.message)
    return `<LcFilterComponentsNotGrouped ${attrs.join(" ")} />`
  }
}
