import { ImageResponse } from "next/server";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage:
            "radial-gradient(circle at 20% 20%, #ff6b6b, #f0466f 45%, #432371)",
          color: "white",
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        A
      </div>
    ),
    size,
  );
}
