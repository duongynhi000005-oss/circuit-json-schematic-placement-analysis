import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["CB"],
  pin2: ["GND"],
  pin3: ["FB"],
  pin4: ["EN"],
  pin5: ["VIN"],
  pin6: ["SW"],
} as const

const pinAttributes = {
  pin2: { requiresGround: true },
  pin5: { requiresPower: true },
} as const

export const LMR50410XDBVR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
        jlcpcb: ["C2841056"],
      }}
      manufacturerPartNumber="LMR50410XDBVR"
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-0.94996mm"
            pcbY="-1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="0mm"
            pcbY="-1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin3"]}
            pcbX="0.94996mm"
            pcbY="-1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin4"]}
            pcbX="0.94996mm"
            pcbY="1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin5"]}
            pcbX="0mm"
            pcbY="1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin6"]}
            pcbX="-0.94996mm"
            pcbY="1.149096mm"
            width="0.532003mm"
            height="1.072007mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: 1.5391891999998961, y: -0.8892031999998835 },
              { x: 1.5391891999998961, y: 0.8892031999999972 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -1.5391892000000098, y: -0.8892031999998835 },
              { x: -1.5391892000000098, y: 0.8892031999999972 },
            ]}
          />
          <silkscreencircle
            pcbX="-1.668272mm"
            pcbY="-1.301496mm"
            radius="0.150114mm"
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.1524mm"
            pcbY="2.6764mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardoutline
            outline={[
              { x: -1.6999843999999484, y: 1.9350994999999784 },
              { x: 1.7000097999999753, y: 1.9350994999999784 },
              { x: 1.7000097999999753, y: -1.9350994999998647 },
              { x: -1.6999843999999484, y: -1.9350994999998647 },
              { x: -1.6999843999999484, y: 1.9350994999999784 },
            ]}
          />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2841056.obj?uuid=229b69761e2c45dba6a83d8866dec72d",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C2841056.step?uuid=229b69761e2c45dba6a83d8866dec72d",
        pcbRotationOffset: 90,
        modelOriginPosition: {
          x: -0.000012700000070253736,
          y: 0.000012700000070253736,
          z: -0.048939,
        },
      }}
      {...props}
    />
  )
}
