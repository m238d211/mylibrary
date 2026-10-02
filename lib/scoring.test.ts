import { describe, expect, it } from "vitest";
import { calculateScore, passesQualityThresholds, QUALITY, statusForScore } from "./scoring";
describe("scoring", () => { it("caps popularity signals and penalizes archived projects", () => { const score = calculateScore({ npmDownloads: 10_000_000, githubStars: 100_000, daysSinceUpdate: 0, daysSinceRelease: 0, archived: false, hasRepository: true }); const archived = calculateScore({ npmDownloads: 10_000_000, githubStars: 100_000, daysSinceUpdate: 0, daysSinceRelease: 0, archived: true, hasRepository: true }); expect(score.total).toBeLessThanOrEqual(100); expect(archived.total).toBeLessThan(score.total); }); it("assigns an explicit status", () => { expect(statusForScore(80)).toBe("Established"); expect(statusForScore(20)).toBe("Needs Review"); }); });
describe("quality thresholds", () => {
  const base = { npmName: "widget", description: "A useful widget library", archived: false, daysSinceUpdate: 10, npmDownloads: 50_000, githubStars: 1_500, score: 60 };
  it("accepts popular, active, described tools", () => {
    expect(passesQualityThresholds(base)).toBe(true);
    expect(passesQualityThresholds({ ...base, npmName: null, npmDownloads: null, githubStars: 5_000 })).toBe(true);
    expect(passesQualityThresholds({ ...base, daysSinceUpdate: null })).toBe(true);
  });
  it("rejects archived, stale, unpopular, low-scoring, undescribed, and denied packages", () => {
    expect(passesQualityThresholds({ ...base, archived: true })).toBe(false);
    expect(passesQualityThresholds({ ...base, daysSinceUpdate: 400 })).toBe(false);
    expect(passesQualityThresholds({ ...base, npmDownloads: 1_000, githubStars: 100 })).toBe(false);
    expect(passesQualityThresholds({ ...base, npmDownloads: 5_000_000, githubStars: 60 })).toBe(false);
    expect(passesQualityThresholds({ ...base, npmDownloads: 100_000_000, githubStars: 1_000 })).toBe(false);
    expect(passesQualityThresholds({ ...base, githubStars: null })).toBe(false);
    expect(passesQualityThresholds({ ...base, score: QUALITY.minScore - 1 })).toBe(false);
    expect(passesQualityThresholds({ ...base, description: "No description provided." })).toBe(false);
    for (const name of ["@types/react", "react-is", "scheduler", "tslib", "@babel/runtime"]) expect(passesQualityThresholds({ ...base, npmName: name })).toBe(false);
  });
});
