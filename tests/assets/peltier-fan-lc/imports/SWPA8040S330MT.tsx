import type { InductorProps } from "@tscircuit/props"

export const SWPA8040S330MT = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="33uH"
      supplierPartNumbers={{
        jlcpcb: ["C83467"],
      }}
      manufacturerPartNumber="SWPA8040S330MT"
      // Sunlord SWPA8040S recommended land pattern: 3.8 mm gap,
      // 2.2 x 7.5 mm pads, with centres at +/-3.0 mm (datasheet page 2).
      // https://atta.szlcsc.com/upload/public/pdf/source/20190109/C361638_7901FB77EA6D5D90885BF852E01DD0FD.pdf
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-3mm"
            pcbY="0mm"
            width="2.2mm"
            height="7.5mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="3mm"
            pcbY="0mm"
            width="2.2mm"
            height="7.5mm"
            shape="rect"
          />
          <silkscreenpath
            route={[
              { x: -4.150004399999943, y: 4.450029200000017 },
              { x: 4.150004399999943, y: 4.450003799999877 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.150004399999943, y: -4.45000379999999 },
              { x: 4.150004399999943, y: -4.450029200000017 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.150004399999943, y: 4.450029200000017 },
              { x: -4.150004399999943, y: 4.331131800000094 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: -4.150004399999943, y: -4.33113179999998 },
              { x: -4.150004399999943, y: -4.45000379999999 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 4.150004399999943, y: -4.450029200000017 },
              { x: 4.150004399999943, y: -4.33113179999998 },
            ]}
          />
          <silkscreenpath
            route={[
              { x: 4.150004399999943, y: 4.331131800000094 },
              { x: 4.150004399999943, y: 4.450003799999877 },
            ]}
          />
          <silkscreentext
            text="{NAME}"
            pcbX="-0.001397mm"
            pcbY="5.445mm"
            anchorAlignment="center"
            fontSize="1mm"
          />
          <courtyardrect width="8.8mm" height="8.8mm" />
        </footprint>
      }
      cadModel={{
        objUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C83467.obj?uuid=6dd7f26bae554279b6f5912a8916ae99",
        stepUrl:
          "https://modelcdn.tscircuit.com/easyeda_models/assets/C83467.step?uuid=6dd7f26bae554279b6f5912a8916ae99",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.00004999999999988347, z: 0 },
      }}
      {...props}
    />
  )
}
