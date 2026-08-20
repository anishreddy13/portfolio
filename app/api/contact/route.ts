import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export const runtime = "nodejs";

// ── Supabase with SERVICE ROLE key (server-only, bypasses RLS) ───────────────
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface ContactPayload {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  company?: string;
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 3;
const MAX_FIELD_LENGTHS = { name: 80, email: 120, subject: 140, message: 3000 };

function jsonResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function getClientIp(request: NextRequest) {
  if (process.env.TRUST_PROXY_HEADERS !== "true") return "unknown";
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

function rateLimitKey(ip: string) {
  const salt = process.env.CONTACT_RATE_LIMIT_SALT;
  if (!salt) return null;
  return createHash("sha256").update(salt + ":" + ip).digest("hex");
}

async function isRateLimited(request: NextRequest) {
  const db = getServiceSupabase();
  const key = rateLimitKey(getClientIp(request));
  if (!db || !key) {
    return null;
  }

  const { data, error } = await db.rpc("check_contact_rate_limit", {
    request_key: key,
    window_seconds: RATE_LIMIT_WINDOW_MS / 1000,
    max_requests: RATE_LIMIT_MAX,
  });

  if (error || typeof data !== "boolean") {
    console.error("[Contact API] Rate-limit check failed.", { code: error?.code, message: error?.message });
    return null;
  }

  return data;
}

function sanitize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePayload(payload: ContactPayload) {
  const name    = sanitize(payload.name);
  const email   = sanitize(payload.email);
  const subject = sanitize(payload.subject) || "Portfolio contact request";
  const message = sanitize(payload.message);
  const company = sanitize(payload.company);

  if (company) return { ok: false as const, reason: "Spam detected." };
  if (!name || !email || !message)
    return { ok: false as const, reason: "Name, email, and message are required." };
  if (!isValidEmail(email))
    return { ok: false as const, reason: "Please enter a valid email address." };
  if (
    name.length    > MAX_FIELD_LENGTHS.name    ||
    email.length   > MAX_FIELD_LENGTHS.email   ||
    subject.length > MAX_FIELD_LENGTHS.subject ||
    message.length > MAX_FIELD_LENGTHS.message
  ) return { ok: false as const, reason: "Message contains fields that are too long." };

  return { ok: true as const, data: { name, email, subject, message } };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function storeSubmission(data: {
  name: string; email: string; subject: string; message: string; timestamp: string;
}) {
  const db = getServiceSupabase();
  if (!db) {
    console.warn("[Contact API] Supabase service role not configured — skipping storage.");
    return false;
  }
  try {
    const { error } = await db.from("contact_submissions").insert([{
      name:       data.name,
      email:      data.email,
      subject:    data.subject,
      message:    data.message,
      created_at: data.timestamp,
    }]);
    if (error) {
      console.error("[Contact API] Supabase insert error:", {
        code: error.code, message: error.message, details: error.details, hint: error.hint,
      });
      return false;
    }
    console.log("[Contact API] Stored in Supabase successfully.");
    return true;
  } catch (err) {
    console.warn("[Contact API] Supabase storage exception:", err);
    return false;
  }
}


async function sendEmail(data: {
  name: string; email: string; subject: string; message: string; timestamp: string;
}) {
  const resendApiKey  = process.env.RESEND_API_KEY;
  const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL;
  if (!resendApiKey || !receiverEmail) {
    console.warn("[Contact API] Resend not configured — skipping email.");
    return false;
  }

  const safe = {
    name:      escapeHtml(data.name),
    email:     escapeHtml(data.email),
    subject:   escapeHtml(data.subject),
    message:   escapeHtml(data.message).replace(/\n/g, "<br />"),
    timestamp: escapeHtml(data.timestamp),
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:     "Portfolio Contact <onboarding@resend.dev>",
        to:       [receiverEmail],
        reply_to: data.email,
        subject:  `Portfolio Contact: ${data.subject}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;background:#f7f7f7;padding:24px;">
            <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;padding:24px;">
              <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#ff2d2d;margin:0 0 16px;">New Portfolio Message</p>
              <h1 style="font-size:24px;margin:0 0 18px;color:#111;">${safe.subject}</h1>
              <p><strong>Name:</strong> ${safe.name}</p>
              <p><strong>Email:</strong> ${safe.email}</p>
              <p><strong>Timestamp:</strong> ${safe.timestamp}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:22px 0;" />
              <p style="margin:0;">${safe.message}</p>
            </div>
          </div>
        `,
        text: [
          "New Portfolio Message",
          `Name: ${data.name}`,
          `Email: ${data.email}`,
          `Subject: ${data.subject}`,
          `Timestamp: ${data.timestamp}`,
          "",
          data.message,
        ].join("\n"),
      }),
    });

    if (res.ok) {
      console.log("[Contact API] Email sent via Resend.");
      return true;
    }
    console.error("[Contact API] Resend failed:", await res.text());
    return false;
  } catch (err) {
    console.error("[Contact API] Resend network error:", err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const limited = await isRateLimited(request);
  if (limited === null) {
    return jsonResponse({ ok: false, message: "Contact service is temporarily unavailable." }, 503);
  }
  if (limited) {
    return jsonResponse(
      { ok: false, message: "Too many messages. Please wait a minute and try again." },
      429
    );
  }

  let payload: ContactPayload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ ok: false, message: "Invalid request body." }, 400);
  }

  const validation = validatePayload(payload);
  if (!validation.ok) {
    return jsonResponse({ ok: false, message: validation.reason }, 400);
  }

  const timestamp = new Date().toISOString();
  const { name, email, subject, message } = validation.data;

  // Diagnostic config audit (no secrets exposed in output)
  console.log("[Contact API] Request received", {
    resendConfigured:   Boolean(process.env.RESEND_API_KEY && process.env.CONTACT_RECEIVER_EMAIL),
    supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    timestamp,
  });

  // Run both delivery channels in parallel
  const [emailSent, stored] = await Promise.all([
    sendEmail({ name, email, subject, message, timestamp }),
    storeSubmission({ name, email, subject, message, timestamp }),
  ]);

  if (emailSent || stored) {
    return jsonResponse(
      { ok: true, message: "Message sent! I\u2019ll get back to you within 24 hours." },
      200
    );
  }

  // Both failed — inform user and log environment variable names to check
  console.error(
    "[Contact API] FAILURE — both email and storage failed. " +
    "Verify Vercel env vars: RESEND_API_KEY, CONTACT_RECEIVER_EMAIL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL"
  );
  return jsonResponse(
    {
      ok: false,
      message:
        "Your message couldn\u2019t be delivered right now. Please email me directly at anishreddy1373@gmail.com.",
    },
    503
  );
}
