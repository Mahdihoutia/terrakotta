import { ImageResponse } from "next/og";

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
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.5,
          }}
        />

        {/* Dark gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(5,16,31,0.95) 0%, rgba(5,16,31,0.5) 50%, rgba(5,16,31,0.2) 100%)",
            display: "flex",
          }}
        />

        {/* Blue left accent */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, rgba(10,31,78,0.45) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* Top-right badge */}
        <div
          style={{
            position: "absolute",
            top: 48,
            right: 72,
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid rgba(96,165,250,0.45)",
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
              display: "flex",
            }}
          />
          <span
            style={{
              color: "#93C5FD",
              fontSize: 13,
              letterSpacing: "0.15em",
            }}
          >
            kilowater.fr
          </span>
        </div>

        {/* Bottom content */}
        <div
          style={{
            position: "absolute",
            bottom: 68,
            left: 80,
            right: 80,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 28,
            }}
          >
            <span style={{ fontSize: 30 }}>⚡</span>
            <span
              style={{
                color: "white",
                fontSize: 24,
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
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 18,
              display: "flex",
            }}
          >
            Bureau d&apos;étude en rénovation énergétique
          </div>

          {/* Title line 1 */}
          <div
            style={{
              color: "white",
              fontSize: 62,
              fontWeight: 300,
              lineHeight: 1.08,
              display: "flex",
            }}
          >
            Rénover l&apos;existant,
          </div>

          {/* Title line 2 */}
          <div
            style={{
              color: "#93C5FD",
              fontSize: 62,
              fontWeight: 300,
              fontStyle: "italic",
              lineHeight: 1.08,
              display: "flex",
            }}
          >
            construire l&apos;avenir.
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
