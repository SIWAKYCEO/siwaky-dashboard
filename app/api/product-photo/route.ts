import { readFileSync } from "fs";
import { join } from "path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Streams the hero/PDP product JPEG from disk. Used via `beforeFiles` rewrite so
 * `/images/product.jpg` resolves even when the edge/proxy/static layer misses `public/`.
 */
export async function GET() {
  try {
    const fp = join(process.cwd(), "public", "images", "product.jpg");
    const buf = readFileSync(fp);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
