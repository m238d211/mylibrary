import nodemailer from "nodemailer";
import { z } from "zod";
import { classifyTool } from "./classification";
import {
  canonicalRepositoryUrl,
  deduplicateCandidates,
  type Candidate,
} from "./normalization";
import { calculateScore, statusForScore } from "./scoring";
import { createServiceClient } from "./supabase";

const githubRepoSchema = z.object({
  full_name: z.string(),
  html_url: z.string().url(),
  description: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  topics: z.array(z.string()).optional(),
  updated_at: z.string().datetime(),
  archived: z.boolean(),
});
const githubSearchSchema = z.object({ items: z.array(githubRepoSchema) });
const npmSearchSchema = z.object({
  objects: z.array(
    z.object({
      package: z.object({
        name: z.string(),
        description: z.string().nullable(),
        keywords: z.array(z.string()).optional(),
        links: z
          .object({
            npm: z.string().url().optional(),
            homepage: z.string().url().optional(),
            repository: z.string().url().optional(),
          })
          .optional(),
      }),
    }),
  ),
});
const timeout = (ms: number) => AbortSignal.timeout(ms);
async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    signal: timeout(10_000),
    headers: {
      accept: "application/vnd.github+json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`External source returned ${response.status}`);
  return response.json();
}
export function assertCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(
    secret && request.headers.get("authorization") === `Bearer ${secret}`,
  );
}
export async function collectTools() {
  const service = createServiceClient();
  const run = await service
    .from("collection_runs")
    .insert({ status: "running" })
    .select("id")
    .single();
  if (run.error || !run.data)
    throw new Error("Unable to create collection run");
  const failures: string[] = [];
  let candidates: Candidate[] = [];
  try {
    const github = githubSearchSchema.parse(
      await fetchJson(
        "https://api.github.com/search/repositories?q=topic:web-development+topic:typescript&sort=updated&order=desc&per_page=20",
        {
          headers: process.env.GITHUB_TOKEN
            ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : undefined,
        },
      ),
    );
    candidates = github.items.map((repo) => ({
      name: repo.full_name.split("/")[1],
      repositoryUrl: repo.html_url,
      description: repo.description ?? "No description provided.",
      keywords: repo.topics ?? [],
    }));
  } catch {
    failures.push("GitHub");
  }
  try {
    const npm = npmSearchSchema.parse(
      await fetchJson(
        "https://registry.npmjs.org/-/v1/search?text=keywords:web-development&size=20",
      ),
    );
    candidates = candidates.concat(
      npm.objects.map(({ package: item }) => ({
        name: item.name,
        npmName: item.name,
        repositoryUrl: item.links?.repository,
        description: item.description ?? "No description provided.",
        keywords: item.keywords ?? [],
      })),
    );
  } catch {
    failures.push("npm");
  }
  const unique = deduplicateCandidates(candidates);
  let processed = 0;
  for (const candidate of unique.slice(0, 30)) {
    const category = classifyTool([
      candidate.name,
      candidate.description,
      ...candidate.keywords,
    ]);
    const repoUrl = canonicalRepositoryUrl(candidate.repositoryUrl);
    const score = calculateScore({
      npmDownloads: null,
      githubStars: null,
      daysSinceUpdate: null,
      daysSinceRelease: null,
      archived: false,
      hasRepository: Boolean(repoUrl),
    });
    const payload = {
      slug: candidate.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 80),
      name: candidate.name,
      description: candidate.description.slice(0, 500),
      category,
      github_url: repoUrl,
      npm_url: candidate.npmName
        ? `https://www.npmjs.com/package/${encodeURIComponent(candidate.npmName)}`
        : null,
      score: score.total,
      status: statusForScore(score.total),
      score_breakdown: score,
      last_collected_at: new Date().toISOString(),
      is_published: false,
    };
    const result = await service
      .from("tools")
      .upsert(payload, { onConflict: "slug" });
    if (result.error) failures.push(`tool:${candidate.name}`);
    else processed += 1;
  }
  await service
    .from("collection_runs")
    .update({
      status: failures.length ? "partial" : "completed",
      completed_at: new Date().toISOString(),
      new_tools: processed,
      failed_sources: failures,
      summary: { candidates: candidates.length, unique: unique.length },
    })
    .eq("id", run.data.id);
  return {
    runId: run.data.id,
    newTools: processed,
    candidates: candidates.length,
    failures,
  };
}
export async function sendWeeklyReport(summary: {
  newTools: number;
  failures: string[];
}) {
  const primaryRecipient = process.env.OWNER_EMAIL;
  const secondaryRecipient = process.env.SECONDARY_OWNER_EMAIL;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM ?? user;
  const recipients = [
    ...new Set(
      [primaryRecipient, secondaryRecipient].filter((value): value is string =>
        Boolean(value),
      ),
    ),
  ];
  if (!primaryRecipient || !host || !user || !password || !from)
    throw new Error("Email configuration is missing");
  const service = createServiceClient();
  const week = new Date();
  week.setUTCDate(week.getUTCDate() - ((week.getUTCDay() + 6) % 7));
  const reportingWeek = week.toISOString().slice(0, 10);
  const existing = await service.from("weekly_reports").select("id,delivery_status").eq("reporting_week", reportingWeek).maybeSingle();
  if (existing.error) throw new Error("Unable to inspect weekly report status");
  if (existing.data?.delivery_status === "sent") return { skipped: true };
  const report = existing.data ?? (await service.from("weekly_reports").insert({ reporting_week: reportingWeek, recipient: recipients.join(","), summary, delivery_status: "pending" }).select("id").single()).data;
  if (!report) throw new Error("Unable to create weekly report record");
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass: password } });
  try { const result = await transporter.sendMail({ from, to: recipients.join(","), subject: "MyLibrary weekly collection report", text: `New or updated tools: ${summary.newTools}. Failed sources: ${summary.failures.join(", ") || "None"}.`, html: `<p>New or updated tools: <strong>${summary.newTools}</strong></p><p>Failed sources: ${summary.failures.join(", ") || "None"}</p>` }); await service.from("weekly_reports").update({ delivery_status: "sent", sent_at: new Date().toISOString(), resend_id: result.messageId }).eq("id", report.id); return { skipped: false, sent: true }; } catch (error) { await service.from("weekly_reports").update({ delivery_status: "failed" }).eq("id", report.id); throw error; }
}
