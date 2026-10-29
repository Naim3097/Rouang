import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { MARK, WORDMARK } from "@/components/brand/paths";

export const OG_SIZE = { width: 1200, height: 630 };

/** Social cards are served as JPEG: a PNG of a photograph is several times larger. */
export async function asJpeg(card: ImageResponse) {
  const png = Buffer.from(await card.arrayBuffer());
  const jpg = await sharp(png).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}

async function font(file: string) {
  return fs.readFile(path.join(process.cwd(), "node_modules/@fontsource", file));
}

function svgDataUri(def: typeof WORDMARK | typeof MARK, fill: string) {
  const paths = def.paths.map((p) => `<path fill="${fill}" transform="matrix(${p.m.join(",")})" d="${p.d}"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${def.width} ${def.height}">${paths}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/**
 * Social card in the brand's own terms: Chinese Black field, wordmark top left on the margin,
 * the mark in the opposite corner (kit p.8), headline in Outfit, the italic line in EB Garamond.
 */
export async function brandCard({ kicker, title, italic, image }: { kicker: string; title: string; italic?: string; image?: string | null }) {
  const [outfit400, outfit500, garamond] = await Promise.all([
    font("outfit/files/outfit-latin-400-normal.woff"),
    font("outfit/files/outfit-latin-500-normal.woff"),
    font("eb-garamond/files/eb-garamond-latin-400-italic.woff"),
  ]);

  // The photograph is cropped and compressed to the card's own size before embedding, so the
  // card stays small enough for WhatsApp and LinkedIn previews.
  let photo: string | null = null;
  if (image && image.startsWith("/") && /\.(jpe?g|png)$/i.test(image)) {
    try {
      const buf = await sharp(path.join(process.cwd(), "public", image))
        .resize({ width: 500, height: 630, fit: "cover", position: "attention" })
        .jpeg({ quality: 72, mozjpeg: true })
        .toBuffer();
      photo = `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch {
      photo = null;
    }
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#141414", color: "#F3F3F3", fontFamily: "Outfit" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, width: photo ? 700 : 1200 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={svgDataUri(WORDMARK, "#F3F3F3")} width={196} height={36} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 18, letterSpacing: "0.12em", textTransform: "uppercase", color: "#949495" }}>{kicker}</div>
            <div style={{ fontSize: photo ? 58 : 68, fontWeight: 500, lineHeight: 1.04, letterSpacing: "-0.03em", marginTop: 22 }}>{title}</div>
            {italic ? (
              <div style={{ fontFamily: "Garamond", fontStyle: "italic", fontSize: photo ? 60 : 70, lineHeight: 1.05, color: "#888E7E", marginTop: 6 }}>
                {italic}
              </div>
            ) : null}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ fontFamily: "Garamond", fontStyle: "italic", fontSize: 26, color: "#949495" }}>Ruang tanpa batas.</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photo ? null : <img src={svgDataUri(MARK, "#F3F3F3")} width={30} height={30} alt="" />}
          </div>
        </div>
        {photo ? (
          <div style={{ display: "flex", width: 500, height: 630, position: "relative" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} width={500} height={630} style={{ objectFit: "cover", width: 500, height: 630 }} alt="" />
          </div>
        ) : null}
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Outfit", data: outfit400, weight: 400, style: "normal" },
        { name: "Outfit", data: outfit500, weight: 500, style: "normal" },
        { name: "Garamond", data: garamond, weight: 400, style: "italic" },
      ],
    },
  );
}
