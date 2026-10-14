import { LMR50410XDBVR } from "../../imports/LMR50410XDBVR"
import { SWPA8040S330MT } from "../../imports/SWPA8040S330MT"
import { A_470531000 as PcFanHeader } from "../../imports/A_470531000"
import { UMK325BJ106KM_T as Capacitor10uF50V } from "../../imports/UMK325BJ106KM_T"
import { GRM32ER71E226KE15L as Capacitor22uF25V } from "../../imports/GRM32ER71E226KE15L"
import { CC0603KRX7R9BB104 as Capacitor100nF50V } from "../parts/C14663"
import { A_0603WAF1001T5E as Resistor0603 } from "../../imports/A_0603WAF1001T5E"

// TI LMR50410: 1 V feedback reference, 700 kHz, internal compensation,
// synchronous rectification and 1.8 ms typical soft-start. The 33 uH filter
// follows TI's 12 V example (datasheet table 9-1); 110k / 10k gives 12 V.
// https://www.ti.com/lit/ds/symlink/lmr50410.pdf
// User fan budget: 12 V / 0.5 A continuous. The regulator's 1 A rating and
// cycle-by-cycle protection do not implement a precision 0.5 A current limit.
export function FanPowerBlock() {
  return (
    <>
      {/* Fan power remains on while qualified PD is present, including TEC Off.
        It is independent of the variable TEC output. */}
      <LMR50410XDBVR
        name="U_FAN"
        pcbX={-13}
        pcbY={-33}
        schSheetName="FAN"
        connections={{
          pin1: "net.FAN_BOOT",
          pin2: "net.GND",
          pin3: "net.FAN_FB",
          pin4: "net.VBUS_QUALIFIED",
          pin5: "net.VBUS_QUALIFIED",
          pin6: "net.FAN_SW",
        }}
      />
      <SWPA8040S330MT
        name="L_FAN"
        pcbX={-3}
        pcbY={-34}
        schSheetName="FAN"
        connections={{ pin1: "net.FAN_SW", pin2: "net.FAN_12V" }}
      />
      <Capacitor10uF50V
        name="C_FAN_IN"
        maxVoltageRating="50V"
        pcbX={-22}
        pcbY={-33}
        schSheetName="FAN"
        connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.GND" }}
      />
      <Capacitor100nF50V
        name="C_FAN_IN_HF"
        maxVoltageRating="50V"
        pcbX={-19}
        pcbY={-36}
        schSheetName="FAN"
        connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.GND" }}
      />
      <Capacitor100nF50V
        name="C_FAN_BOOT"
        maxVoltageRating="50V"
        pcbX={-13}
        pcbY={-38}
        schSheetName="FAN"
        connections={{ pin1: "net.FAN_BOOT", pin2: "net.FAN_SW" }}
      />
      <Capacitor22uF25V
        name="C_FAN_OUT1"
        maxVoltageRating="25V"
        pcbX={14}
        pcbY={-31}
        schSheetName="FAN"
        connections={{ pin1: "net.FAN_12V", pin2: "net.GND" }}
      />
      <Capacitor22uF25V
        name="C_FAN_OUT2"
        maxVoltageRating="25V"
        pcbX={14}
        pcbY={-36}
        schSheetName="FAN"
        connections={{ pin1: "net.FAN_12V", pin2: "net.GND" }}
      />
      <Resistor0603
        name="R_FAN_FB_TOP"
        resistance="110k"
        manufacturerPartNumber="0603WAF1103T5E"
        supplierPartNumbers={{ jlcpcb: ["C25805"] }}
        pcbX={5}
        pcbY={-31}
        schSheetName="FAN"
        connections={{ pin1: "net.FAN_12V", pin2: "net.FAN_FB" }}
      />
      <Resistor0603
        name="R_FAN_FB_BOTTOM"
        resistance="10k"
        manufacturerPartNumber="0603WAF1002T5E"
        supplierPartNumbers={{ jlcpcb: ["C25804"] }}
        pcbX={5}
        pcbY={-36}
        schSheetName="FAN"
        connections={{ pin1: "net.FAN_FB", pin2: "net.GND" }}
      />
      {/* Molex 47053-1000 is a standard keyed PC fan header. Compatible 12 V
        3-pin fans use pins 1-3; 4-pin fans run at full speed with PWM unconnected.
        Tach is not monitored. Noctua's PWM whitepaper specifies this header.
        https://noctua.at/pub/media/wysiwyg/Noctua_PWM_specifications_white_paper.pdf */}
      <PcFanHeader
        name="J_FAN"
        pcbX={44}
        pcbY={-29}
        pcbRotation={90}
        schSheetName="FAN"
        connections={{ pin1: "net.GND", pin2: "net.FAN_12V" }}
        noConnect={["pin3", "pin4"]}
      />
      <silkscreentext
        text="FAN 12V / 0.5A"
        pcbX={29}
        pcbY={-34}
        fontSize={0.9}
      />
    </>
  )
}
