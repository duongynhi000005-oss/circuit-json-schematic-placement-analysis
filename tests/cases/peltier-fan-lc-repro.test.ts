import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { createPeltierFanLcRepro } from "../assets/peltier-fan-lc"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"
import {
  expectReproNets,
  expectReproRendered,
} from "../fixtures/placement-repro-assertions"

test("reproduces the complete fan supply sheet with its original TSX and LC network", async () => {
  const circuitJson = await createPeltierFanLcRepro()
  expectReproRendered(circuitJson, 10)
  expectReproNets(circuitJson, [
    [
      "net.GND",
      "U_FAN.pin2",
      "C_FAN_IN.pin2",
      "C_FAN_IN_HF.pin2",
      "C_FAN_OUT1.pin2",
      "C_FAN_OUT2.pin2",
      "R_FAN_FB_BOTTOM.pin2",
      "J_FAN.pin1",
    ],
    [
      "net.VBUS_QUALIFIED",
      "U_FAN.pin4",
      "U_FAN.pin5",
      "C_FAN_IN.pin1",
      "C_FAN_IN_HF.pin1",
    ],
    ["net.FAN_BOOT", "U_FAN.pin1", "C_FAN_BOOT.pin1"],
    ["net.FAN_SW", "U_FAN.pin6", "C_FAN_BOOT.pin2", "L_FAN.pin1"],
    [
      "net.FAN_12V",
      "L_FAN.pin2",
      "C_FAN_OUT1.pin1",
      "C_FAN_OUT2.pin1",
      "R_FAN_FB_TOP.pin1",
      "J_FAN.pin2",
    ],
    ["net.FAN_FB", "U_FAN.pin3", "R_FAN_FB_TOP.pin2", "R_FAN_FB_BOTTOM.pin1"],
  ])
  const points = circuitJson.flatMap((e) =>
    e.type === "schematic_component"
      ? [
          {
            x: e.center.x - e.size.width / 2,
            y: e.center.y - e.size.height / 2,
          },
          {
            x: e.center.x + e.size.width / 2,
            y: e.center.y + e.size.height / 2,
          },
        ]
      : e.type === "schematic_port"
        ? [e.center]
        : [],
  )
  const viewportBounds = {
    left: Math.min(...points.map((p) => p.x)) - 1.8,
    right: Math.max(...points.map((p) => p.x)) + 1.8,
    bottom: Math.min(...points.map((p) => p.y)) - 1.8,
    top: Math.max(...points.map((p) => p.y)) + 1.8,
  }
  const analysis = analyzeSchematicPlacement(circuitJson)
  expect(analysis.getIssues().map((issue) => issue.lineItemType)).toEqual([
    "TwoPinComponentShouldBeVertical",
    "TwoPinComponentShouldBeVertical",
    "DecouplingCapacitorsNotCloseTogether",
    "DecouplingCapacitorsNotCloseTogether",
    "LcFilterComponentsNotGrouped",
  ])
  expect(
    createIssueReproSnapshot({
      circuitJson,
      analysis,
      width: 1500,
      height: 850,
      showFullSchematic: false,
      viewportBounds,
      showOverlay: true,
      showIssueGeometry: false,
      issueTypes: ["LcFilterComponentsNotGrouped"],
      showListingIssueMarkers: true,
    }),
  ).toMatchSvgSnapshot(import.meta.path, "full-sheet")
})
