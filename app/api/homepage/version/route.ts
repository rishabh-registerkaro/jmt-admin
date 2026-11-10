import { NextResponse } from "next/server";
import { getHomepageVersion } from "@/server/homepage";

// Public, tiny: lets open homepage tabs notice a new save and refresh
// themselves. jmt-frontend's own /api/homepage/version forwards here (its
// LiveRefresh component polls that). The read is cached under the "homepage"
// tag, so polling it does not hit MySQL.
export const dynamic = "force-dynamic";

export async function GET() {
  const version = await getHomepageVersion();
  return NextResponse.json({ version }, { headers: { "Cache-Control": "no-store" } });
}
