import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

describe("access.status", () => {
  it("denies a caller without an authenticated server-side user", async () => {
    const ctx = {
      user: null,
      req: { protocol: "https", headers: {} },
      res: {},
    } as TrpcContext;
    const caller = appRouter.createCaller(ctx);

    await expect(caller.access.status()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
