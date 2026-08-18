import { getActiveLexiconEntitlement, listLexiconPurchasesForUser } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { createOnlineAccessCheckout, onlineAccessConfig } from "../onlineLexiconCommerce";

/** Member-facing access status. Payment identifiers and provider metadata stay server-private. */
export const accessRouter = router({
  product: publicProcedure.query(() => {
    const config = onlineAccessConfig();
    return { configured: config.configured, accessDurationDays: config.accessDurationDays, webhookConfigured: Boolean(config.stripeWebhookSecret) };
  }),
  startCheckout: protectedProcedure.mutation(async ({ ctx }) => {
    return createOnlineAccessCheckout({ userId: ctx.user.id, email: ctx.user.email });
  }),
  status: protectedProcedure.query(async ({ ctx }) => {
    const [entitlement, purchases] = await Promise.all([
      getActiveLexiconEntitlement(ctx.user.id),
      listLexiconPurchasesForUser(ctx.user.id),
    ]);
    const ownerPreview = ctx.user.role === "admin";
    return {
      accessMode: ownerPreview ? "owner_preview" as const : entitlement ? "member" as const : "none" as const,
      account: {
        name: ctx.user.name,
        email: ctx.user.email,
        loginMethod: ctx.user.loginMethod,
      },
      entitlement: ownerPreview
        ? {
            status: "owner_preview" as const,
            startsAt: null,
            endsAt: null,
            productKey: "owner_preview",
          }
        : entitlement
        ? {
            status: entitlement.status,
            startsAt: entitlement.startsAt,
            endsAt: entitlement.endsAt,
            productKey: entitlement.productKey,
          }
        : null,
      purchases: purchases.map(purchase => ({
        productKey: purchase.productKey,
        status: purchase.status,
        accessEndsAt: purchase.accessEndsAt,
        createdAt: purchase.createdAt,
      })),
    };
  }),
});
