import { ImageResponse } from "next/og";

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
          background: "#0a0e14",
          color: "#e8edf4",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 72,
            height: 72,
            borderRadius: 16,
            background: "#6366f1",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 700,
          }}
        >
          BP
        </div>
        <div style={{ marginTop: 36, fontSize: 56, fontWeight: 700 }}>
          Board Playground
        </div>
        <div style={{ marginTop: 16, fontSize: 28, color: "#94a3b8" }}>
          Original board games in the browser
        </div>
      </div>
    ),
    size
  );
}
