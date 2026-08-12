import { NextResponse } from "next/server";
import { assertCronSecret, collectTools, sendWeeklyReport } from "@/lib/collection";
export async function GET(request: Request) {
  if (!assertCronSecret(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const summary = await collectTools(); if (process.env.OWNER_EMAIL && process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) await sendWeeklyReport(summary); return NextResponse.json({ ok: true, ...summary }); } catch (error) { console.error("Collection failed", error instanceof Error ? error.message : "unknown error"); return NextResponse.json({ error: "Collection failed" }, { status: 500 }); }
}
