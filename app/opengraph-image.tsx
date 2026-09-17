import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE, SITE_TAGLINE_SUB } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          background: "linear-gradient(145deg, #1c1826 0%, #12101a 45%, #0e0c14 100%)",
          color: "#f4f0f8",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #ff5c8a 0%, #ffb347 100%)",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 800,
            color: "#ffffff",
          }}
        >
          ボ
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 72,
            fontWeight: 800,
            background: "linear-gradient(90deg, #ff5c8a, #ffc14d)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {SITE_NAME}
        </div>
        <div style={{ marginTop: 20, fontSize: 30, color: "#e2e8f0", lineHeight: 1.5 }}>
          {SITE_TAGLINE}
        </div>
        <div style={{ marginTop: 12, fontSize: 26, color: "#94a3b8", lineHeight: 1.5 }}>
          {SITE_TAGLINE_SUB}
        </div>
      </div>
    ),
    size
  );
}
