import type { Tool, ToolSort } from "./types";
import { createPublicClient } from "./supabase";

const toolColumns = "id,slug,name,description,category,github_url,npm_url,homepage_url,github_stars,npm_downloads,latest_version,score,status,discovered_at,updated_at";
type ToolRow = { id: string; slug: string; name: string; description: string; category: string; github_url: string | null; npm_url: string | null; homepage_url: string | null; github_stars: number | null; npm_downloads: number | null; latest_version: string | null; score: number; status: Tool["status"]; discovered_at: string; updated_at: string | null };
const toTool = (item: ToolRow): Tool => ({ id: item.id, slug: item.slug, name: item.name, description: item.description, category: item.category, githubUrl: item.github_url, npmUrl: item.npm_url, homepageUrl: item.homepage_url, githubStars: item.github_stars, npmDownloads: item.npm_downloads, latestVersion: item.latest_version, score: item.score, status: item.status, discoveredAt: item.discovered_at, updatedAt: item.updated_at });

export async function getPublishedTools(options: { limit?: number; query?: string; category?: string; sort?: ToolSort } = {}): Promise<Tool[]> {
  const client = createPublicClient();
  if (!client) return [];
  let query = client.from("tools").select(toolColumns).eq("is_published", true).limit(Math.min(options.limit ?? 24, 100));
  if (options.category && options.category !== "all") query = query.eq("category", options.category);
  if (options.query) query = query.ilike("search_text", `%${options.query.replace(/[%_]/g, "\\$&").slice(0, 80)}%`);
  const order = options.sort === "downloads" || options.sort === "popularity" ? "npm_downloads" : options.sort === "newest" ? "discovered_at" : options.sort === "activity" ? "updated_at" : "score";
  const { data } = await query.order(order, { ascending: false, nullsFirst: false });
  return ((data ?? []) as ToolRow[]).map(toTool);
}

export async function getPublishedToolBySlug(slug: string): Promise<Tool | null> {
  // Slugs are generated as lowercase a-z, 0-9 and dashes; anything else cannot match a row.
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const client = createPublicClient();
  if (!client) return null;
  const { data } = await client.from("tools").select(toolColumns).eq("is_published", true).eq("slug", slug).maybeSingle();
  return data ? toTool(data as ToolRow) : null;
}
