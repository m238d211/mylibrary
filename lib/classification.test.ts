import { describe, expect, it } from "vitest";
import { classifyTool } from "./classification";
describe("classification", () => { it("uses deterministic keyword matching", () => { expect(classifyTool(["schema", "validation", "forms"])).toBe("Forms and Validation"); expect(classifyTool(["something-unrelated"])).toBe("Other"); expect(classifyTool(["angular-20", "signals framework"])).toBe("Other"); expect(classifyTool(["axios", "HTTP client"])).toBe("Data Fetching"); }); });
