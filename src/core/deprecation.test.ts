import { describe, expect, it, vi } from "vitest";
import { deprecated } from "./deprecation.js";

describe("deprecated", () => {
  it("warns once per name, naming the replacement", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    deprecated("oldThing", "newThing", "0.2.0");
    deprecated("oldThing", "newThing", "0.2.0");
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain("Use newThing instead");
    warn.mockRestore();
  });
});
