import type { Tool, ToolSort } from "./types";
import { createPublicClient } from "./supabase";

export async function getPublishedTools(options: { limit?: number; query?: string; category?: string; sort?: ToolSort } = {}): Promise<Tool[]> {
  const client = createPublicClient();
  if (!client) return [];
  let query = client.from("tools").select("id,slug,name,description,category,github_url,npm_url,homepage_url,github_stars,npm_downloads,latest_version,score,status,discovered_at,updated_at").eq("is_published", true).limit(Math.min(options.limit ?? 24, 100));
  if (options.category && options.category !== "all") query = query.eq("category", options.category);
  if (options.query) query = query.ilike("search_text", `%${options.query.replace(/[%_]/g, "\\$&").slice(0, 80)}%`);
  const order = options.sort === "downloads" || options.sort === "popularity" ? "npm_downloads" : options.sort === "newest" ? "discovered_at" : options.sort === "activity" ? "updated_at" : "score";
  const { data } = await query.order(order, { ascending: false, nullsFirst: false });
  return (data ?? []).map((item) => ({ id: item.id, slug: item.slug, name: item.name, description: item.description, category: item.category, githubUrl: item.github_url, npmUrl: item.npm_url, homepageUrl: item.homepage_url, githubStars: item.github_stars, npmDownloads: item.npm_downloads, latestVersion: item.latest_version, score: item.score, status: item.status, discoveredAt: item.discovered_at, updatedAt: item.updated_at }));
}
