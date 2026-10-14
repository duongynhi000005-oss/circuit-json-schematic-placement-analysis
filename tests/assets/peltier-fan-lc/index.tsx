import { Circuit } from "@tscircuit/core"
import { FanPowerBlock } from "./src/board/fan-power"

// Complete FAN sheet from 0hmX/dual-usb-peltier-assembly v0.4.3.
// https://tscircuit.com/0hmX/dual-usb-peltier-assembly?version=0.4.3#schematic
// Registry release: 6991f07d-2100-420b-9047-46d7c87b3acf.
// Original sheet/import TSX; external sheet connections remain named nets.
export async function createPeltierFanLcRepro() {
  const circuit = new Circuit()
  circuit.pcbDisabled = true
  circuit.add(
    <board routingDisabled schTraceAutoLabelEnabled schMaxTraceDistance={0.5}>
      <net name="GND" isGroundNet />
      <schematicsheet
        name="FAN"
        displayName="Fixed 12 V fan power"
        sheetIndex={4}
      />
      <FanPowerBlock />
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}
