import type { ScoreBreakdown } from "./scoring";
export type ToolStatus = "Established" | "Growing" | "New and Promising" | "Needs Review";
export type Tool = { id: string; slug: string; name: string; description: string; category: string; githubUrl: string | null; npmUrl: string | null; homepageUrl: string | null; githubStars: number | null; npmDownloads: number | null; latestVersion: string | null; score: number; status: ToolStatus; discoveredAt: string; updatedAt: string | null; };
export type ToolSort = "score" | "popularity" | "newest" | "downloads" | "activity";
export type ToolDetail = Tool & { scoreBreakdown: ScoreBreakdown | null };
