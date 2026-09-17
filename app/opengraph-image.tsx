import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE, SITE_TAGLINE_SUB } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const dot = (left: number, top: number) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width: 14,
      height: 14,
      borderRadius: 999,
      background: "#1d1d1f",
    }}
  />
);

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#000000",
          color: "#f5f5f7",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "relative",
            width: 80,
            height: 80,
            borderRadius: 18,
            background: "#f5f5f7",
          }}
        >
          {dot(18, 18)}
          {dot(48, 18)}
          {dot(33, 33)}
          {dot(18, 48)}
          {dot(48, 48)}
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 72,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          {SITE_NAME}
        </div>
        <div style={{ marginTop: 20, fontSize: 30, color: "#a1a1a6", lineHeight: 1.5 }}>
          {SITE_TAGLINE}
        </div>
        <div style={{ marginTop: 12, fontSize: 26, color: "#86868b", lineHeight: 1.5 }}>
          {SITE_TAGLINE_SUB}
        </div>
      </div>
    ),
    size
  );
}
