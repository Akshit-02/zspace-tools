import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg width="512" height="512" viewBox="0 0 32 32">
        <rect width="32" height="32" rx="9" fill="#252525" />
        <rect x="8" y="8" width="16" height="3.4" rx="1.2" fill="#FAF7F2" />
        <rect x="8" y="20.6" width="16" height="3.4" rx="1.2" fill="#FAF7F2" />
        <path d="M22.4 11.4 9.6 20.6" stroke="#F07845" strokeWidth="3.4" strokeLinecap="round" />
      </svg>
    ),
    size,
  );
}
