import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

const starterPackUrl = "/manus-storage/orbion-space-industry-starter-pack_f0e10736.pdf";

const captureSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(320),
  editionInterest: z.enum(["collector", "hardcover", "paperback", "starter-pack", "updates"]),
  source: z.enum(["preorder-form", "starter-pack-form"]),
});

type LeadInput = z.infer<typeof captureSchema>;

function integrationConfig() {
  return {
    captureEnabled: process.env.PREORDER_CAPTURE_ENABLED === "true",
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    resendApiKey: process.env.RESEND_API_KEY,
    resendFromEmail: process.env.RESEND_FROM_EMAIL,
  };
}

async function saveLeadToSupabase(lead: LeadInput) {
  const { captureEnabled, supabaseUrl, supabaseServiceRoleKey } = integrationConfig();

  if (!captureEnabled || !supabaseUrl || !supabaseServiceRoleKey) {
    return { configured: false as const };
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/preorder_leads?on_conflict=email`, {
    method: "POST",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      name: lead.name,
      email: lead.email.toLowerCase(),
      edition_interest: lead.editionInterest,
      source: lead.source,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error("We could not save your preorder request. Please try again shortly.");
  }

  return { configured: true as const };
}

async function sendResendConfirmation(lead: LeadInput) {
  const { resendApiKey, resendFromEmail } = integrationConfig();

  if (!resendApiKey || !resendFromEmail) return;

  const isStarterPack = lead.source === "starter-pack-form";
  const subject = isStarterPack
    ? "Your Orbion Space Lexicon Starter Pack"
    : "You’re on the Orbion Space Lexicon first-edition list";
  const previewNote = isStarterPack
    ? `<p>Your 10-page illustrated preview is ready: <a href="${starterPackUrl}">download the Starter Pack</a>.</p>`
    : "";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [lead.email],
      subject,
      html: `<div style="font-family:Georgia,serif;color:#0A1A2B;max-width:560px;margin:auto"><p style="font-family:Arial,sans-serif;letter-spacing:.08em;color:#28B7CF;font-size:12px">THE ORBION SPACE LEXICON</p><h1 style="font-size:28px">Thank you, ${lead.name}.</h1><p>You are now on the first-edition list for <strong>The Orbion Space Lexicon</strong>.</p><p>The expected delivery date is <strong>October 31, 2026</strong>.</p>${previewNote}<p style="margin-top:28px">— Anthony Galeano<br/>Founder, Orbion</p></div>`,
    }),
  });

  if (!response.ok) {
    console.error("[Resend] Confirmation email could not be sent", await response.text());
  }
}

export const preorderRouter = router({
  /** Public, runtime-only lookup used by the static Vercel storefront. */
  checkoutLinks: publicProcedure.query(() => ({
    collector: process.env.VITE_STRIPE_COLLECTOR_PAYMENT_LINK || null,
    hardcover: process.env.VITE_STRIPE_HARDCOVER_PAYMENT_LINK || null,
    paperback: process.env.VITE_STRIPE_PAPERBACK_PAYMENT_LINK || null,
  })),
  capture: publicProcedure.input(captureSchema).mutation(async ({ input }) => {
    const saved = await saveLeadToSupabase(input);

    if (!saved.configured) {
      return {
        accepted: false,
        configured: false,
        starterPackUrl: null,
      };
    }

    await sendResendConfirmation(input);

    return {
      accepted: true,
      configured: true,
      starterPackUrl: input.source === "starter-pack-form" ? starterPackUrl : null,
    };
  }),
});

export { captureSchema, integrationConfig };
