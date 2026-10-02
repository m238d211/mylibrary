import { describe, expect, it } from "vitest";
import { canonicalRepositoryUrl, deduplicateCandidates } from "./normalization";
describe("normalization", () => { it("canonicalizes GitHub repository URLs", () => { expect(canonicalRepositoryUrl("https://github.com/Acme/Widget.git/" )).toBe("https://github.com/acme/widget"); }); it("deduplicates by package name", () => { const result = deduplicateCandidates([{ name: "A", npmName: "pkg", description: "", keywords: [] }, { name: "B", npmName: "PKG", description: "", keywords: [] }]); expect(result).toHaveLength(1); }); });
describe("repository URL forms", () => {
  it.each([
    "git+https://github.com/react/react.git",
    "git://github.com/react/react.git",
    "git+ssh://git@github.com/react/react.git",
    "ssh://git@github.com/react/react.git",
    "git@github.com:react/react.git",
    "github:react/react",
    "react/react",
    "https://github.com/React/React/tree/main/packages/react#readme",
  ])("canonicalizes %s", (value) => {
    expect(canonicalRepositoryUrl(value)).toBe("https://github.com/react/react");
  });
  it("rejects non-GitHub hosts", () => {
    expect(canonicalRepositoryUrl("git+https://gitlab.com/acme/widget.git")).toBeNull();
    expect(canonicalRepositoryUrl("")).toBeNull();
    expect(canonicalRepositoryUrl("gitlab.com/acme")).toBeNull();
  });
});
describe("candidate merging", () => {
  it("merges candidates sharing a repository and keeps the package named like the repository", () => {
    const result = deduplicateCandidates([
      { name: "vite", repositoryUrl: "https://github.com/vitejs/vite", description: "GitHub description", keywords: [], githubStars: 70_000, repositoryUpdatedAt: "2026-09-01T00:00:00Z" },
      { name: "create-vite", npmName: "create-vite", repositoryUrl: "git+https://github.com/vitejs/vite.git", description: "Scaffold", keywords: [], npmDownloads: 900_000 },
      { name: "vite", npmName: "vite", repositoryUrl: "git+https://github.com/vitejs/vite.git", description: "Next generation tooling", keywords: [], npmDownloads: 30_000_000 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ npmName: "vite", description: "Next generation tooling", githubStars: 70_000, npmDownloads: 30_000_000, repositoryUpdatedAt: "2026-09-01T00:00:00Z" });
  });
  it("prefers seeds, then the most downloaded package", () => {
    const seeded = deduplicateCandidates([
      { name: "react-dom", npmName: "react-dom", repositoryUrl: "https://github.com/react/react", description: "DOM", keywords: [], npmDownloads: 50_000_000 },
      { name: "react", npmName: "react", repositoryUrl: "https://github.com/react/react", description: "React", keywords: [], isSeed: true },
    ]);
    expect(seeded[0]).toMatchObject({ npmName: "react", npmDownloads: 50_000_000, isSeed: true });
    const downloaded = deduplicateCandidates([
      { name: "a", npmName: "a", repositoryUrl: "https://github.com/acme/monorepo", description: "A", keywords: [], npmDownloads: 10 },
      { name: "b", npmName: "b", repositoryUrl: "https://github.com/acme/monorepo", description: "B", keywords: [], npmDownloads: 500 },
    ]);
    expect(downloaded).toEqual([expect.objectContaining({ npmName: "b" })]);
  });
});
