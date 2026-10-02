import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  assertCronSecret,
  collectTools,
  sendWeeklyReport,
} from "@/lib/collection";

// Collection fetches external sources sequentially in places; 300 seconds is the Vercel Hobby ceiling with fluid compute.
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!assertCronSecret(request))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const summary = await collectTools();
    try {
      revalidatePath("/");
    } catch (error) {
      console.error(
        "Home page revalidation failed",
        error instanceof Error ? error.message : "unknown error",
      );
    }
    const email = await sendWeeklyReport(summary);
    return NextResponse.json({
      ok: true,
      ...summary,
      email: { sent: email.sent ?? false, skipped: email.skipped ?? false },
    });
  } catch (error) {
    console.error(
      "Collection failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return NextResponse.json({ error: "Collection failed" }, { status: 500 });
  }
}
