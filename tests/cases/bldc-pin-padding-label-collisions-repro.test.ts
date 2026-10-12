import { expect, test } from "bun:test"
import { analyzeSchematicPlacement } from "lib/index"
import { renderBldcSymbol } from "../assets/bldc-pin-padding"
import { createIssueReproSnapshot } from "../fixtures/create-issue-repro-snapshot"
import { measureLabelBankGap } from "../fixtures/measure-label-bank-gap"

test("reports cramped BLDC labels without shrinking and clears them with padded sizes", async () => {
  for (const name of ["U5", "U7", "U8", "U9", "J5"] as const) {
    const circuitJson = await renderBldcSymbol(name)
    const analysis = analyzeSchematicPlacement(circuitJson)
    const collisions = analysis.getIssues({
      issueTypes: ["SchematicBoxInnerLabelCollision"],
    })
    expect(collisions).toHaveLength(1)
    const collision = collisions[0]!
    if (collision.lineItemType !== "SchematicBoxInnerLabelCollision")
      throw Error()
    expect(collision.minimumLabelGap).toBe(0.2)
    const resized = await renderBldcSymbol(name, {
      schWidth: collision.suggestedSchWidth,
      schHeight: collision.suggestedSchHeight,
    })
    expect(
      analyzeSchematicPlacement(resized).getIssues({
        issueTypes: ["SchematicBoxInnerLabelCollision"],
      }),
    ).toHaveLength(0)
    expect(measureLabelBankGap(resized) + 1e-9).toBeGreaterThanOrEqual(0.2)
    const issues = analysis
      .getIssues()
      .filter(
        (issue) => issue.lineItemType === "SchematicPinPaddingToEdgeTooLarge",
      )
    expect(issues).toHaveLength(0)
    await expect(
      createIssueReproSnapshot({
        width: 1200,
        showFullSchematic: true,
        showOverlay: false,
        showListingIssueMarkers: true,
        circuitJson,
        analysis,
        height: 550,
      }),
    ).toMatchSvgSnapshot(import.meta.path, name)
  }
})
