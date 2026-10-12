import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { renderBldcSymbol } from "../assets/bldc-pin-padding"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"
import { measureLabelBankGap } from "../fixtures/measure-label-bank-gap"

test("reports cramped BLDC labels, accepts U8's rendered INT label and preserves clearance on resize", async () => {
  for (const name of ["U5", "U7", "U8", "U9", "J5"] as const) {
    const circuitJson = await renderBldcSymbol(name)
    const analysis = analyzeSchematicPlacement(circuitJson)
    const collisions = analysis.getIssues({
      issueTypes: ["SchematicBoxInnerLabelCollision"],
    })
    const paddingIssues = analysis.getIssues({
      issueTypes: ["SchematicPinPaddingToEdgeTooLarge"],
    })
    const suggestion = name === "U8" ? paddingIssues[0] : collisions[0]
    if (name === "U8") {
      // The renderer hides N_ and uses a smaller font for the overlined INT.
      // Measuring the literal N_INT at the normal size wrongly flagged ACDRV2.
      expect(collisions).toHaveLength(0)
      expect(measureLabelBankGap(circuitJson)).toBeGreaterThan(0.2)
      expect(paddingIssues).toHaveLength(1)
    } else {
      expect(collisions).toHaveLength(1)
      expect(paddingIssues).toHaveLength(0)
      expect(collisions[0]).toMatchObject({ minimumLabelGap: 0.2 })
    }
    if (
      !suggestion ||
      (suggestion.lineItemType !== "SchematicBoxInnerLabelCollision" &&
        suggestion.lineItemType !== "SchematicPinPaddingToEdgeTooLarge")
    )
      throw Error("Expected a safe resize suggestion")
    const resized = await renderBldcSymbol(name, {
      schWidth: suggestion.suggestedSchWidth,
      schHeight: suggestion.suggestedSchHeight,
    })
    expect(
      analyzeSchematicPlacement(resized).getIssues({
        issueTypes: ["SchematicBoxInnerLabelCollision"],
      }),
    ).toHaveLength(0)
    expect(measureLabelBankGap(resized) + 1e-9).toBeGreaterThanOrEqual(0.2)
    await expect(
      createIssueReproSnapshot({
        width: 1200,
        showFullSchematic: true,
        showOverlay: true,
        showListingIssueMarkers: true,
        circuitJson,
        analysis,
        height: 550,
      }),
    ).toMatchSvgSnapshot(import.meta.path, name)
  }
})
