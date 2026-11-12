import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#252525" }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <rect x="8" y="8" width="16" height="3.4" rx="1.2" fill="#FAF7F2" />
          <rect x="8" y="20.6" width="16" height="3.4" rx="1.2" fill="#FAF7F2" />
          <path d="M22.4 11.4 9.6 20.6" stroke="#F07845" strokeWidth="3.4" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
