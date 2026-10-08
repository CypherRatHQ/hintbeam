// @vitest-environment node
import { describe, expect, it } from "vitest";
import { browserTourStorage } from "./index.js";

describe("browserTourStorage on the server", () => {
  it("loads nothing and saves nowhere without a window, without throwing", async () => {
    const storage = browserTourStorage();
    expect(typeof window).toBe("undefined");
    await expect(storage.load()).resolves.toBeNull();
    await expect(storage.save({ tours: [] })).resolves.toBeUndefined();
  });
});
