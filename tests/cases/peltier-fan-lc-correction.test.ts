import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { getSourceConnectivity } from "lib/utils/source-connectivity"
import { renderIssueOverlay } from "lib/svg/create-issue-overlay-svg"
import { createAnalyzerTextSvg } from "lib/svg/create-analyzer-text-svg"
import { stackSvgsVertically } from "stack-svgs"
import { createPeltierFanLcRepro } from "../assets/peltier-fan-lc"
import { createPeltierFanLcCorrection } from "../assets/peltier-fan-lc-correction"
import { createPlacementComparisonSvg } from "../fixtures/create-placement-comparison-svg"
import {
  expectReproRendered,
  getReproSourcePort,
} from "../fixtures/placement-repro-assertions"

const partition = (json: CircuitJson) => {
  const connected = getSourceConnectivity(json)
  const groups = new Map<string, string[]>()
  for (const e of json) {
    const id =
      e.type === "source_port"
        ? e.source_port_id
        : e.type === "source_net"
          ? e.source_net_id
          : undefined
    if (!id) continue
    const root = connected(id)
    groups.set(root, [...(groups.get(root) ?? []), id])
  }
  return [...groups.values()]
    .map((g) => g.sort())
    .sort((a, b) => a[0]!.localeCompare(b[0]!))
}

test("groups the fan LC network and clears all findings without changing the circuit", async () => {
  const before = await createPeltierFanLcRepro()
  const after = await createPeltierFanLcCorrection()
  expectReproRendered(after, 10)
  for (const type of [
    "source_component",
    "source_trace",
    "source_net",
    "source_group",
    "source_component_internal_connection",
    "schematic_symbol",
  ])
    expect(after.filter((e) => e.type === type)).toEqual(
      before.filter((e) => e.type === type),
    )
  // Core adds pos/neg aliases to automatically placed capacitors. Compare all
  // source-port identity/metadata except those generated orientation aliases.
  const ports = (json: CircuitJson) =>
    json
      .filter((e) => e.type === "source_port")
      .map(({ port_hints, ...port }) => port)
  expect(ports(after)).toEqual(ports(before))
  expect(partition(after)).toEqual(partition(before))
  const baseline = analyzeSchematicPlacement(before)
  const analysis = analyzeSchematicPlacement(after)
  const issues = baseline.getIssues({
    issueTypes: ["LcFilterComponentsNotGrouped"],
  })
  expect(issues).toHaveLength(1)
  expect(analysis.getIssues()).toEqual([])
  // The inductor and both capacitor pins must be joined by visible wires,
  // not merely connected through hidden labels in the electrical model.
  const endpoints = [
    ["L_FAN", "pin2"],
    ["C_FAN_OUT1", "pin1"],
    ["C_FAN_OUT2", "pin1"],
  ].map(([name, pin]) => {
    const source = getReproSourcePort(after, name!, pin!)
    const port = after.find(
      (e) =>
        e.type === "schematic_port" &&
        e.source_port_id === source.source_port_id,
    )
    if (port?.type !== "schematic_port") throw new Error("Missing LC pin")
    return port.center
  })
  const key = (p: { x: number; y: number }) =>
    `${p.x.toFixed(6)},${p.y.toFixed(6)}`
  const edges = after.flatMap((e) =>
    e.type === "schematic_trace" ? e.edges : [],
  )
  // Split edges at every endpoint so a T junction also participates in the graph.
  const points = edges.flatMap((e) => [e.from, e.to]).concat(endpoints)
  const graph = new Map<string, Set<string>>()
  for (const edge of edges) {
    const on = points.filter(
      (p) =>
        Math.abs(
          (p.x - edge.from.x) * (edge.to.y - edge.from.y) -
            (p.y - edge.from.y) * (edge.to.x - edge.from.x),
        ) < 1e-6 &&
        p.x >= Math.min(edge.from.x, edge.to.x) - 1e-6 &&
        p.x <= Math.max(edge.from.x, edge.to.x) + 1e-6 &&
        p.y >= Math.min(edge.from.y, edge.to.y) - 1e-6 &&
        p.y <= Math.max(edge.from.y, edge.to.y) + 1e-6,
    )
    for (const p of on)
      graph.set(key(p), new Set([...(graph.get(key(p)) ?? []), ...on.map(key)]))
  }
  const visited = new Set<string>(),
    pending = [key(endpoints[0]!)]
  while (pending.length) {
    const node = pending.pop()!
    if (visited.has(node)) continue
    visited.add(node)
    pending.push(...(graph.get(node) ?? []))
  }
  expect(endpoints.every((p) => visited.has(key(p)))).toBe(true)
  expect(
    createPlacementComparisonSvg({
      subject: "complete fan supply",
      before: { circuitJson: before, analysis: baseline },
      after: { circuitJson: after, analysis },
      issues,
      contextSourceComponentIds: before
        .filter((e) => e.type === "source_component")
        .map((e) => e.source_component_id),
      beforeDiagnostic: () =>
        "L_FAN is separated from C_FAN_OUT1 / C_FAN_OUT2.",
      afterDiagnostic:
        "Inductor and output bank grouped with continuous wires.\nFull-sheet analysis: 0 reported issues.",
      note: "Complete 10-component TSX sheet; values and electrical connections preserved.",
    }),
  ).toMatchSvgSnapshot(import.meta.path, "comparison")
  const svg = renderIssueOverlay({
    circuitJson: after,
    analysis,
    showFullSchematic: false,
    showOverlay: false,
    width: 1500,
    height: 780,
    viewportBounds: { left: -5.5, right: 10, top: 3.55, bottom: -4.5 },
  }).svg
  expect(
    stackSvgsVertically(
      [
        `<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="780">${svg}</svg>`,
        createAnalyzerTextSvg(
          "Complete sheet: 10 schematic components.\nFull-sheet analysis: 0 reported issues.",
          1500,
        ),
      ],
      { normalizeSize: false, gap: 0 },
    ),
  ).toMatchSvgSnapshot(import.meta.path, "full-sheet")
})
