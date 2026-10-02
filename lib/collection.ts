import nodemailer from "nodemailer";
import { z } from "zod";
import { classifyTool } from "./classification";
import {
  canonicalRepositoryUrl,
  deduplicateCandidates,
  NO_DESCRIPTION,
  safeHttpUrl,
  type Candidate,
} from "./normalization";
import {
  calculateScore,
  isDeniedPackage,
  passesQualityThresholds,
  statusForScore,
} from "./scoring";
import { createServiceClient } from "./supabase";

const githubRepoSchema = z.object({
  full_name: z.string(),
  html_url: z.string().url(),
  description: z.string().nullable(),
  stargazers_count: z.number().int().nonnegative(),
  topics: z.array(z.string()).optional(),
  updated_at: z.string().datetime(),
  pushed_at: z.string().datetime().nullable().optional(),
  archived: z.boolean(),
});
const githubSearchSchema = z.object({ items: z.array(githubRepoSchema) });
// Link and metadata fields are kept lenient: one malformed package must not invalidate a whole search page.
const npmLinksSchema = z.object({ npm: z.string().optional(), homepage: z.string().optional(), repository: z.string().optional() }).optional();
const npmSearchSchema = z.object({
  objects: z.array(
    z.object({
      downloads: z.object({ weekly: z.number().nonnegative().optional() }).optional(),
      package: z.object({
        name: z.string(),
        description: z.string().nullable().optional(),
        keywords: z.array(z.string()).optional().catch(undefined),
        version: z.string().optional(),
        date: z.string().optional(),
        links: npmLinksSchema,
      }),
    }),
  ),
});
const npmPackageSchema = z.object({ name: z.string(), version: z.string().optional(), description: z.string().nullable().optional(), keywords: z.array(z.string()).optional().catch(undefined), homepage: z.string().optional().catch(undefined), repository: z.union([z.string(), z.object({ url: z.string().optional() })]).optional().catch(undefined) });
const npmDownloadsSchema = z.object({ downloads: z.number().int().nonnegative() });
const featuredPackages = ["react", "react-dom", "axios", "@tanstack/react-query", "@tanstack/react-table", "tailwindcss", "typescript", "next", "vite", "vitest", "jest", "zustand", "redux", "react-redux", "react-hook-form", "zod", "prisma", "drizzle-orm", "framer-motion", "@playwright/test"];
const githubTopics = ["react", "vue", "nextjs", "css", "testing", "nodejs"];
const npmKeywords = ["react", "vue", "css", "testing", "validation", "auth", "orm", "bundler", "animation", "a11y", "state-management", "http"];
const REQUEST_TIMEOUT_MS = 8_000;
const ENRICHMENT_CONCURRENCY = 8;
// Leaves headroom under the route's 300 second maxDuration for scoring, writes, and the email.
const ENRICHMENT_BUDGET_MS = 200_000;
const MAX_UNIQUE_CANDIDATES = 150;
const MAX_PER_CATEGORY = 10;
const MAX_SELECTED = 60;
const DEFAULT_AUTO_PUBLISH_MIN_SCORE = 65;
const DAY_MS = 86_400_000;
const timeout = (ms: number) => AbortSignal.timeout(ms);
async function fetchJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    signal: timeout(REQUEST_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`External source returned ${response.status}`);
  return response.json();
}
const githubHeaders = (): Record<string, string> => ({ accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) });
const daysSince = (value: string | null | undefined) => { const time = value ? Date.parse(value) : Number.NaN; return Number.isNaN(time) ? null : Math.max(0, Math.floor((Date.now() - time) / DAY_MS)); };
const validDate = (value: string | null | undefined) => (value && !Number.isNaN(Date.parse(value)) ? value : null);
const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
// Empty or invalid values fall back to the default so a blank variable never publishes everything.
function autoPublishMinScore() { const raw = process.env.AUTO_PUBLISH_MIN_SCORE?.trim(); const value = raw ? Number(raw) : Number.NaN; return Number.isFinite(value) ? value : DEFAULT_AUTO_PUBLISH_MIN_SCORE; }
// Orders candidates before the enrichment cap: seeds first, then the strongest known downloads or stars signal.
const popularityHint = (candidate: Candidate) => (candidate.isSeed ? 2 : 0) + Math.max(Math.log10((candidate.npmDownloads ?? 0) + 1) / 7, Math.log10((candidate.githubStars ?? 0) + 1) / 5);
async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) { const results: R[] = []; for (let index = 0; index < items.length; index += limit) { results.push(...(await Promise.all(items.slice(index, index + limit).map(mapper)))); } return results; }
async function fetchGithubRepository(repositoryUrl: string | null | undefined) { const canonical = canonicalRepositoryUrl(repositoryUrl); if (!canonical) return null; const path = new URL(canonical).pathname.split("/").filter(Boolean); if (path.length !== 2) return null; try { const repo = githubRepoSchema.parse(await fetchJson(`https://api.github.com/repos/${path[0]}/${path[1]}`, { headers: githubHeaders() })); return { stars: repo.stargazers_count, updatedAt: repo.pushed_at ?? repo.updated_at, archived: repo.archived, repositoryUrl: repo.html_url }; } catch { return null; } }
async function fetchNpmDownloads(packageName: string) { try { const data = npmDownloadsSchema.parse(await fetchJson(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`)); return data.downloads; } catch { return null; } }
async function fetchNpmPackage(packageName: string): Promise<Candidate | null> { try { const item = npmPackageSchema.parse(await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(packageName).replace(/^%40/, "@")}/latest`)); const repositoryUrl = typeof item.repository === "string" ? item.repository : item.repository?.url ?? null; return { name: item.name, npmName: item.name, repositoryUrl, homepageUrl: safeHttpUrl(item.homepage), latestVersion: item.version ?? null, description: item.description || NO_DESCRIPTION, keywords: item.keywords ?? [], isSeed: true }; } catch { return null; } }
async function enrichCandidate(candidate: Candidate): Promise<Candidate> { const knownStars = candidate.githubStars ?? null; const knownDownloads = candidate.npmDownloads ?? null; const [repo, downloads] = await Promise.all([knownStars === null ? fetchGithubRepository(candidate.repositoryUrl) : null, candidate.npmName && knownDownloads === null ? fetchNpmDownloads(candidate.npmName) : null]); return { ...candidate, repositoryUrl: repo?.repositoryUrl ?? candidate.repositoryUrl, githubStars: repo?.stars ?? knownStars, npmDownloads: downloads ?? knownDownloads, repositoryUpdatedAt: repo?.updatedAt ?? candidate.repositoryUpdatedAt ?? null, archived: repo?.archived ?? candidate.archived ?? false }; }
// Writes the batch in one request and falls back to row-by-row writes so one bad row cannot drop the whole batch.
async function writeRows<T extends { name: string }>(rows: T[], write: (rows: T[]) => PromiseLike<{ error: unknown }>, failures: string[]): Promise<T[]> { if (!rows.length) return []; if (!(await write(rows)).error) return rows; const written: T[] = []; for (const row of rows) { if ((await write([row])).error) failures.push(`tool:${row.name}`); else written.push(row); } return written; }
export function assertCronSecret(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(
    secret && request.headers.get("authorization") === `Bearer ${secret}`,
  );
}
export async function collectTools() {
  const startedAt = Date.now();
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
  const featured = await mapWithConcurrency(featuredPackages, ENRICHMENT_CONCURRENCY, fetchNpmPackage);
  candidates = candidates.concat(featured.filter((candidate): candidate is Candidate => candidate !== null));
  // GitHub search allows 10 requests per minute without a token, so topic queries run sequentially.
  const pushedSince = new Date(Date.now() - 180 * DAY_MS).toISOString().slice(0, 10);
  for (const topic of githubTopics) {
    try {
      const query = `topic:${topic} stars:>3000 pushed:>${pushedSince} archived:false`;
      const github = githubSearchSchema.parse(await fetchJson(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`, { headers: githubHeaders() }));
      candidates = candidates.concat(github.items.map((repo) => ({ name: repo.full_name.split("/")[1], repositoryUrl: repo.html_url, description: repo.description || NO_DESCRIPTION, keywords: repo.topics ?? [], githubStars: repo.stargazers_count, repositoryUpdatedAt: repo.pushed_at ?? repo.updated_at, archived: repo.archived })));
    } catch {
      failures.push(`GitHub:${topic}`);
    }
  }
  const npmResults = await Promise.all(npmKeywords.map(async (keyword) => { try { return npmSearchSchema.parse(await fetchJson(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(`keywords:${keyword}`)}&size=25`)).objects; } catch { failures.push(`npm:${keyword}`); return []; } }));
  candidates = candidates.concat(npmResults.flat().map(({ package: item, downloads }) => ({ name: item.name, npmName: item.name, repositoryUrl: item.links?.repository ?? null, homepageUrl: safeHttpUrl(item.links?.homepage), latestVersion: item.version ?? null, description: item.description || NO_DESCRIPTION, keywords: item.keywords ?? [], npmDownloads: downloads?.weekly ?? null, releasedAt: validDate(item.date) })));
  const unique = deduplicateCandidates(candidates.filter((candidate) => !isDeniedPackage(candidate.npmName)))
    .sort((a, b) => popularityHint(b) - popularityHint(a))
    .slice(0, MAX_UNIQUE_CANDIDATES);
  const enriched: Candidate[] = [];
  for (let index = 0; index < unique.length; index += ENRICHMENT_CONCURRENCY) {
    if (Date.now() - startedAt > ENRICHMENT_BUDGET_MS) {
      // Remaining candidates keep the signals their search source already provided.
      failures.push("time-budget");
      enriched.push(...unique.slice(index));
      break;
    }
    enriched.push(...(await Promise.all(unique.slice(index, index + ENRICHMENT_CONCURRENCY).map(enrichCandidate))));
  }
  const now = new Date().toISOString();
  const scored = enriched.map((candidate) => {
    const category = classifyTool([
      candidate.name,
      candidate.description,
      ...candidate.keywords,
    ]);
    const repoUrl = canonicalRepositoryUrl(candidate.repositoryUrl);
    // npm-only candidates fall back to their last publish date so missing activity is not treated as passing.
    const daysSinceUpdate = daysSince(candidate.repositoryUpdatedAt ?? candidate.releasedAt);
    const score = calculateScore({
      npmDownloads: candidate.npmDownloads ?? null,
      githubStars: candidate.githubStars ?? null,
      daysSinceUpdate,
      daysSinceRelease: daysSince(candidate.releasedAt),
      archived: candidate.archived ?? false,
      hasRepository: Boolean(repoUrl),
    });
    // is_published, is_featured, and discovered_at are deliberately absent so updates never overwrite manual choices.
    const payload = {
      slug: slugify(candidate.npmName ?? candidate.name),
      name: candidate.name,
      description: candidate.description.slice(0, 500),
      category,
      github_url: repoUrl,
      homepage_url: safeHttpUrl(candidate.homepageUrl),
      npm_url: candidate.npmName
        ? `https://www.npmjs.com/package/${encodeURIComponent(candidate.npmName)}`
        : null,
      score: score.total,
      status: statusForScore(score.total),
      score_breakdown: score,
      github_stars: candidate.githubStars ?? null,
      npm_downloads: candidate.npmDownloads ?? null,
      updated_at: candidate.repositoryUpdatedAt ?? null,
      latest_version: candidate.latestVersion ?? null,
      last_collected_at: now,
    };
    return { candidate, daysSinceUpdate, payload };
  });
  const qualified = scored
    .filter(({ candidate, daysSinceUpdate, payload }) => payload.slug && passesQualityThresholds({ npmName: candidate.npmName ?? null, description: candidate.description, archived: candidate.archived ?? false, daysSinceUpdate, npmDownloads: candidate.npmDownloads ?? null, githubStars: candidate.githubStars ?? null, score: payload.score }))
    .sort((a, b) => b.payload.score - a.payload.score);
  const seenSlugs = new Set<string>();
  const perCategory = new Map<string, number>();
  const selected = qualified
    .filter(({ payload }) => {
      const categoryCount = perCategory.get(payload.category) ?? 0;
      if (seenSlugs.has(payload.slug) || categoryCount >= MAX_PER_CATEGORY) return false;
      seenSlugs.add(payload.slug);
      perCategory.set(payload.category, categoryCount + 1);
      return true;
    })
    .slice(0, MAX_SELECTED)
    .map(({ payload }) => payload);
  const slugs = selected.map((payload) => payload.slug);
  // If the lookup fails every row is treated as existing: new rows are then inserted unpublished and no publish choice is overwritten.
  let existingSlugs = new Set(slugs);
  if (slugs.length) {
    const existing = await service.from("tools").select("slug").in("slug", slugs);
    if (existing.error) failures.push("tools:lookup");
    else existingSlugs = new Set((existing.data ?? []).map((row) => String(row.slug)));
  }
  const minimumPublishScore = autoPublishMinScore();
  const newRows = selected
    .filter((payload) => !existingSlugs.has(payload.slug))
    .map((payload) => ({ ...payload, is_published: payload.score >= minimumPublishScore }));
  const updatedRows = selected.filter((payload) => existingSlugs.has(payload.slug));
  const insertedRows = await writeRows(newRows, (rows) => service.from("tools").insert(rows), failures);
  const updatedTools = (await writeRows(updatedRows, (rows) => service.from("tools").upsert(rows, { onConflict: "slug" }), failures)).length;
  const newTools = insertedRows.length;
  await service
    .from("collection_runs")
    .update({
      status: failures.length ? "partial" : "completed",
      completed_at: new Date().toISOString(),
      new_tools: newTools,
      updated_tools: updatedTools,
      failed_sources: failures,
      summary: { candidates: candidates.length, unique: unique.length, enriched: enriched.length, qualified: qualified.length, selected: selected.length, autoPublished: insertedRows.filter((row) => row.is_published).length },
    })
    .eq("id", run.data.id);
  return {
    runId: run.data.id,
    newTools,
    updatedTools,
    candidates: candidates.length,
    failures,
  };
}
export async function sendWeeklyReport(summary: {
  newTools: number;
  updatedTools: number;
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
  const existing = await service
    .from("weekly_reports")
    .select("id,delivery_status")
    .eq("reporting_week", reportingWeek)
    .maybeSingle();
  if (existing.error) throw new Error("Unable to inspect weekly report status");
  if (existing.data?.delivery_status === "sent") return { skipped: true };
  const report =
    existing.data ??
    (
      await service
        .from("weekly_reports")
        .insert({
          reporting_week: reportingWeek,
          recipient: recipients.join(","),
          summary,
          delivery_status: "pending",
        })
        .select("id")
        .single()
    ).data;
  if (!report) throw new Error("Unable to create weekly report record");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
  });
  try {
    const result = await transporter.sendMail({
      from,
      to: recipients.join(","),
      subject: "MyLibrary weekly collection report",
      text: `New tools: ${summary.newTools}. Updated tools: ${summary.updatedTools}. Failed sources: ${summary.failures.join(", ") || "None"}.\n\nView the library: https://mylibrary-nine.vercel.app/`,
      html: `<p>New tools: <strong>${summary.newTools}</strong></p><p>Updated tools: <strong>${summary.updatedTools}</strong></p><p>Failed sources: ${summary.failures.join(", ") || "None"}</p><p><a href="https://mylibrary-nine.vercel.app/">View the library</a></p>`,
    });
    await service
      .from("weekly_reports")
      .update({
        delivery_status: "sent",
        sent_at: new Date().toISOString(),
        resend_id: result.messageId,
      })
      .eq("id", report.id);
    return { skipped: false, sent: true };
  } catch (error) {
    await service
      .from("weekly_reports")
      .update({ delivery_status: "failed" })
      .eq("id", report.id);
    throw error;
  }
}
