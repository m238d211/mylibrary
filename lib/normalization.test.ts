import { describe, expect, it } from "vitest";
import { canonicalRepositoryUrl, deduplicateCandidates } from "./normalization";
describe("normalization", () => { it("canonicalizes GitHub repository URLs", () => { expect(canonicalRepositoryUrl("https://github.com/Acme/Widget.git/" )).toBe("https://github.com/acme/widget"); }); it("deduplicates by package name", () => { const result = deduplicateCandidates([{ name: "A", npmName: "pkg", description: "", keywords: [] }, { name: "B", npmName: "PKG", description: "", keywords: [] }]); expect(result).toHaveLength(1); }); });
