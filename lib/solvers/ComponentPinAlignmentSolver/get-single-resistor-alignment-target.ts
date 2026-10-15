import type { SchematicPort } from "circuit-json"
import type { SchematicBoxPlacement } from "../../types"
import type { PlacementNetworkIndex } from "../../utils/placement-network-index"

export function getSingleResistorAlignmentTarget(
  {
    firstPort,
    secondPort,
    placements,
  }: {
    firstPort: SchematicPort
    secondPort: SchematicPort
    placements: SchematicBoxPlacement[]
  },
  index: PlacementNetworkIndex,
): SchematicBoxPlacement | undefined {
  const resistor = placements.find(
    (p) =>
      index.components.get(p.sourceComponentId ?? "")?.ftype ===
      "simple_resistor",
  )
  const chip = placements.find(
    (p) =>
      index.components.get(p.sourceComponentId ?? "")?.ftype === "simple_chip",
  )
  if (!resistor || !chip || !index.sameLocalScope(resistor, chip)) return
  const nets = index.twoTerminalNets(resistor.sourceComponentId!)
  const net = index.connected(firstPort.source_port_id)
  // Exclude rail branches, shared nets and moves larger than a local alignment nudge.
  if (
    !nets ||
    nets.some((net) => index.isRail(net)) ||
    index.connected(secondPort.source_port_id) !== net ||
    index.portsByNet.get(net)?.length !== 2 ||
    Math.abs(firstPort.center.y - secondPort.center.y) > resistor.height / 2
  )
    return
  return resistor
}
