import { Circuit } from "@tscircuit/core"
import type { ChipProps } from "@tscircuit/props"
import { Children, cloneElement, isValidElement } from "react"
import { FanPowerBlock } from "./peltier-fan-lc/src/board/fan-power"

// Drawing-only overrides of the original TSX: all connections and imports remain intact.
const placements: Record<string, Partial<ChipProps>> = {
  U_FAN: {
    schX: 0,
    schY: 0,
    schWidth: 1.4,
    schHeight: 0.8,
    schPinArrangement: {
      leftSide: { pins: [5, 4], direction: "top-to-bottom" },
      rightSide: { pins: [1, 6, 3], direction: "top-to-bottom" },
      bottomSide: { pins: [2], direction: "left-to-right" },
    },
  },
  L_FAN: { schX: 3.2, schY: 0, schRotation: 0 },
  C_FAN_BOOT: { schX: 1.9, schY: 1, schRotation: 90 },
  C_FAN_IN: { schX: -2.5, schY: -0.6, schRotation: 270 },
  C_FAN_IN_HF: { schX: -3.9, schY: -0.6, schRotation: 270 },
  C_FAN_OUT1: { schX: 4.7, schY: -0.8, schRotation: 270 },
  C_FAN_OUT2: { schX: 6.1, schY: -0.8, schRotation: 270 },
  R_FAN_FB_TOP: { schX: 2, schY: -1.7, schRotation: 270 },
  R_FAN_FB_BOTTOM: { schX: 2, schY: -3.3, schRotation: 270 },
  J_FAN: { schX: 8.5, schY: 0.1 },
}

export async function createPeltierFanLcCorrection() {
  const circuit = new Circuit()
  circuit.pcbDisabled = true
  circuit.add(
    <board
      routingDisabled
      schLayout={{ layoutMode: "relative" }}
      schTraceAutoLabelEnabled
      schMaxTraceDistance={3}
    >
      <net name="GND" isGroundNet />
      <schematicsheet
        name="FAN"
        displayName="Fixed 12 V fan power"
        sheetIndex={4}
      />
      {Children.map(FanPowerBlock().props.children, (child) =>
        isValidElement<{ name?: string }>(child) && child.props.name
          ? cloneElement(child, placements[child.props.name])
          : child,
      )}
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}
