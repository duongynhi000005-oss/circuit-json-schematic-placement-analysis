import { Circuit } from "@tscircuit/core"

export async function createLcFilter({
  grouped = false,
  rotation = 0,
  pi = false,
  secondInductor = false,
  chipLoad = false,
  crystalLoad = false,
  bank = true,
  powerLabel = false,
}: {
  grouped?: boolean
  rotation?: number
  pi?: boolean
  secondInductor?: boolean
  chipLoad?: boolean
  crystalLoad?: boolean
  bank?: boolean
  powerLabel?: boolean
} = {}) {
  const circuit = new Circuit()
  circuit.pcbDisabled = true
  const position = (x: number, y: number) => {
    const angle = (rotation * Math.PI) / 180
    return {
      schX: x * Math.cos(angle) - y * Math.sin(angle),
      schY: x * Math.sin(angle) + y * Math.cos(angle),
    }
  }
  circuit.add(
    <board routingDisabled schTraceAutoLabelEnabled schMaxTraceDistance={3}>
      <net name="return" isGroundNet />
      <net name="out" isPowerNet={powerLabel} />
      <inductor
        name="L1"
        inductance="33uH"
        {...position(0, 0)}
        schRotation={rotation}
        connections={{ pin1: "net.in", pin2: "net.out" }}
      />
      <capacitor
        name="C1"
        capacitance="22uF"
        {...position(grouped ? 2 : 12, -1)}
        schRotation={rotation - 90}
        connections={{ pin1: "net.out", pin2: "net.return" }}
      />
      {bank && (
        <capacitor
          name="C2"
          capacitance="10uF"
          {...position(grouped ? 3.4 : 13.4, -1)}
          schRotation={rotation - 90}
          connections={{ pin1: "net.out", pin2: "net.return" }}
        />
      )}
      {pi && (
        <capacitor
          name="C3"
          capacitance="10uF"
          {...position(-2, -1)}
          schRotation={rotation - 90}
          connections={{ pin1: "net.in", pin2: "net.return" }}
        />
      )}
      {secondInductor && (
        <inductor
          name="L2"
          inductance="33uH"
          {...position(-4, 0)}
          schRotation={rotation}
          connections={{ pin1: "net.other", pin2: "net.in" }}
        />
      )}
      {crystalLoad && (
        <crystal
          name="Y1"
          frequency="40MHz"
          loadCapacitance="12pF"
          {...position(16, 0)}
          connections={{ pin1: "net.out", pin2: "net.other" }}
        />
      )}
      {chipLoad && (
        <chip
          name="U1"
          pinLabels={{ pin1: "A", pin2: "B" }}
          {...position(16, 0)}
          connections={{ pin1: "net.out", pin2: "net.return" }}
        />
      )}
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}
