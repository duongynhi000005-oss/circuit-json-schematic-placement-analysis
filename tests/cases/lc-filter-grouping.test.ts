import { expect, test } from "bun:test"
import type { CircuitJson } from "circuit-json"
import { analyzeSchematicPlacement } from "lib/index"
import { createLcFilter } from "../assets/lc-filter-grouping"
import {
  getReproSchematicComponent,
  getReproSourcePort,
} from "../fixtures/placement-repro-assertions"

test("LC grouping uses typed connectivity and accepts compact or ambiguous alternatives", async () => {
  const issues = (json: CircuitJson) =>
    analyzeSchematicPlacement(json, {
      issueTypes: ["LcFilterComponentsNotGrouped"],
    }).getIssues()
  const before = await createLcFilter()
  const serialized = JSON.stringify(before)
  expect(issues(before)).toMatchObject([
    {
      lineItemType: "LcFilterComponentsNotGrouped",
      inductorSchematicBox: { sourceComponentName: "L1" },
      capacitorSchematicBoxes: [
        { sourceComponentName: "C1" },
        { sourceComponentName: "C2" },
      ],
    },
  ])
  const full = analyzeSchematicPlacement(before)
  expect(full.getIssues()).toEqual(issues(before))
  expect(full.getIssueCounts().LcFilterComponentsNotGrouped).toBe(1)
  expect(full.getIssues({ schematicSheetId: "other" })).toEqual([])
  expect(full.schematicIssuesToString(issues(before)[0]!)).toContain(
    'capacitorNames="C1, C2"',
  )
  expect(JSON.stringify(before)).toBe(serialized)
  for (const options of [
    { rotation: 90 },
    { rotation: 180 },
    { rotation: 270 },
    { bank: false },
    { powerLabel: true },
  ]) {
    expect(issues(await createLcFilter(options))).toHaveLength(1)
    expect(issues(await createLcFilter({ ...options, grouped: true }))).toEqual(
      [],
    )
  }
  for (const options of [
    { pi: true },
    { secondInductor: true },
    { chipLoad: true },
    { crystalLoad: true },
  ])
    expect(issues(await createLcFilter(options))).toEqual([])
  const guards: Record<string, (json: CircuitJson) => void> = {
    "ground name without ground flags": (json) => {
      for (const e of json)
        if (e.type === "source_net") {
          e.is_ground = false
          e.name = "GND"
        }
    },
    "different sheet": (json) => {
      getReproSchematicComponent(json, "C2").schematic_sheet_id = "remote"
    },
    "different block": (json) => {
      getReproSchematicComponent(json, "C2").schematic_group_id = "remote"
    },
    "duplicate placement": (json) => {
      json.push({
        ...getReproSchematicComponent(json, "C2"),
        schematic_component_id: "duplicate",
      })
    },
    "unconnected capacitor pin": (json) => {
      getReproSourcePort(json, "C2", "pin2").do_not_connect = true
    },
    "unconnected inductor pin": (json) => {
      getReproSourcePort(json, "L1", "pin1").do_not_connect = true
    },
    "missing capacitor geometry": (json) => {
      const id = getReproSourcePort(json, "C2", "pin1").source_port_id
      json.splice(
        json.findIndex(
          (e) => e.type === "schematic_port" && e.source_port_id === id,
        ),
        1,
      )
    },
    "nonfinite pin": (json) => {
      const id = getReproSourcePort(json, "L1", "pin2").source_port_id
      const pin = json.find(
        (e) => e.type === "schematic_port" && e.source_port_id === id,
      )
      if (pin?.type === "schematic_port") pin.center.x = Number.NaN
    },
    "zero capacitance": (json) => {
      for (const e of json)
        if (e.type === "source_component" && e.ftype === "simple_capacitor")
          e.capacitance = 0
    },
    "shorted inductor": (json) => {
      json.push({
        type: "source_trace",
        source_trace_id: "short",
        connected_source_net_ids: [],
        connected_source_port_ids: [
          getReproSourcePort(json, "L1", "pin1").source_port_id,
          getReproSourcePort(json, "L1", "pin2").source_port_id,
        ],
      })
    },
  }
  for (const [name, mutate] of Object.entries(guards)) {
    const json = structuredClone(before)
    mutate(json)
    expect(issues(json), name).toEqual([])
  }
  const renamed = structuredClone(before)
  for (const e of renamed) {
    if (e.type === "source_component") {
      e.name = "unrelated"
      delete e.manufacturer_part_number
    }
    if (e.type === "source_port") {
      e.name = "unrelated"
      e.port_hints = []
    }
    if (e.type === "source_net") e.name = "unrelated"
    if (
      e.type === "source_port" ||
      e.type === "source_net" ||
      e.type === "source_trace"
    )
      delete e.subcircuit_connectivity_map_key
  }
  expect(issues(renamed)).toHaveLength(1)
  const groundPort = structuredClone(before)
  for (const e of groundPort) if (e.type === "source_net") e.is_ground = false
  getReproSourcePort(groundPort, "C1", "pin2").requires_ground = true
  expect(issues(groundPort)).toHaveLength(1)
  const remotePi = await createLcFilter({ pi: true })
  getReproSchematicComponent(remotePi, "C3").schematic_group_id = "remote"
  expect(issues(remotePi)).toEqual([])
  const populated = structuredClone(before)
  const id = getReproSourcePort(populated, "L1", "pin1").source_component_id!
  populated.push({
    type: "pcb_component",
    pcb_component_id: "optional",
    source_component_id: id,
    center: { x: 0, y: 0 },
    width: 1,
    height: 1,
    layer: "top",
    rotation: 0,
    do_not_place: true,
    obstructs_within_bounds: true,
  })
  expect(issues(populated)).toEqual([])
  populated.push({
    ...(populated.at(-1) as Extract<
      CircuitJson[number],
      { type: "pcb_component" }
    >),
    pcb_component_id: "installed",
    do_not_place: false,
  })
  expect(issues(populated)).toHaveLength(1)
})
