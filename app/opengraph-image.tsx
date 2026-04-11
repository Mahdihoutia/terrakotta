import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Kilowater — Bureau d'étude en rénovation énergétique";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#0D1B35",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Background hero photo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1695445301510-459fb368d8af?w=1200&q=80&auto=format&fit=crop"
          alt=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.55,
          }}
        />

        {/* Dark gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(5,16,31,0.92) 0%, rgba(5,16,31,0.45) 55%, rgba(5,16,31,0.2) 100%)",
            display: "flex",
          }}
        />

        {/* Blue left accent */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(10,31,78,0.4) 0%, transparent 60%)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "absolute",
            bottom: 72,
            left: 80,
            right: 80,
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563EB",
                fontSize: 28,
                fontWeight: 900,
              }}
            >
              ⚡
            </div>
            <span
              style={{
                color: "white",
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: "0.1em",
              }}
            >
              KILOWATER
            </span>
          </div>

          {/* Eyebrow */}
          <div
            style={{
              color: "#60A5FA",
              fontSize: 13,
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: 20,
            }}
          >
            Bureau d&apos;étude en rénovation énergétique
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: 64,
                fontWeight: 300,
                lineHeight: 1.05,
              }}
            >
              Rénover l&apos;existant,
            </div>
            <div
              style={{
                color: "#93C5FD",
                fontSize: 64,
                fontWeight: 300,
                fontStyle: "italic",
                lineHeight: 1.05,
              }}
            >
              construire l&apos;avenir.
            </div>
          </div>
        </div>

        {/* Top-right badge */}
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 80,
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid rgba(96,165,250,0.4)",
            borderRadius: 9999,
            padding: "8px 20px",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#60A5FA",
            }}
          />
          <span
            style={{
              color: "#93C5FD",
              fontSize: 12,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            kilowater.fr
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
