import { describe, expect, it } from "vitest";
import { classifyTool } from "./classification";
describe("classification", () => { it("uses deterministic keyword matching", () => { expect(classifyTool(["schema", "validation", "forms"])).toBe("Forms and Validation"); expect(classifyTool(["something-unrelated"])).toBe("Other"); }); });
