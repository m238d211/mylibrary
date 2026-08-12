import { describe, expect, it } from "vitest";
import { GET } from "./route";
describe("collection authorization", () => {
  it("rejects missing credentials", async () => {
    const response = await GET(
      new Request("http://localhost/api/cron/collect"),
    );
    expect(response.status).toBe(401);
  });
});
