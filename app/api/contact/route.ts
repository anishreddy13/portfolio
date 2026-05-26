import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

export const runtime = "nodejs";

interface ContactPayload {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  company?: string;
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 3;
const MAX_FIELD_LENGTHS = {
  name: 80,
  email: 120,
  subject: 140,
  message: 3000,
};

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function jsonResponse(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const current = rateLimitStore.get(ip);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return true;
  }

  current.count += 1;
  rateLimitStore.set(ip, current);
  return false;
}

function sanitize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePayload(payload: ContactPayload) {
  const name = sanitize(payload.name);
  const email = sanitize(payload.email);
  const subject = sanitize(payload.subject) || "Portfolio contact request";
  const message = sanitize(payload.message);
  const company = sanitize(payload.company);

  if (company) {
    return { ok: false as const, reason: "Spam detected." };
  }

  if (!name || !email || !message) {
    return { ok: false as const, reason: "Name, email, and message are required." };
  }

  if (!isValidEmail(email)) {
    return { ok: false as const, reason: "Please enter a valid email address." };
  }

  if (
    name.length > MAX_FIELD_LENGTHS.name ||
    email.length > MAX_FIELD_LENGTHS.email ||
    subject.length > MAX_FIELD_LENGTHS.subject ||
    message.length > MAX_FIELD_LENGTHS.message
  ) {
    return { ok: false as const, reason: "Message contains fields that are too long." };
  }

  return {
    ok: true as const,
    data: { name, email, subject, message },
  };
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
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
}) {
  if (!supabase) return;

  try {
    await supabase.from("contact_submissions").insert([
      {
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        created_at: data.timestamp,
      },
    ]);
  } catch (error) {
    console.warn("Contact submission storage skipped:", error);
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
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

  const resendApiKey = process.env.RESEND_API_KEY;
  const receiverEmail = process.env.CONTACT_RECEIVER_EMAIL;

  if (!resendApiKey || !receiverEmail) {
    return jsonResponse(
      { ok: false, message: "Contact delivery is not configured yet." },
      503
    );
  }

  const timestamp = new Date().toISOString();
  const { name, email, subject, message } = validation.data;
  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(email),
    subject: escapeHtml(subject),
    message: escapeHtml(message).replace(/\n/g, "<br />"),
    timestamp: escapeHtml(timestamp),
  };

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Portfolio Contact <onboarding@resend.dev>",
      to: [receiverEmail],
      reply_to: email,
      subject: `Portfolio Contact: ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;background:#f7f7f7;padding:24px;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;padding:24px;">
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
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
        `Timestamp: ${timestamp}`,
        "",
        message,
      ].join("\n"),
    }),
  });

  if (!resendResponse.ok) {
    console.error("Resend contact delivery failed:", await resendResponse.text());
    return jsonResponse(
      { ok: false, message: "Message could not be sent. Please try again." },
      502
    );
  }

  await storeSubmission({ name, email, subject, message, timestamp });

  return jsonResponse({ ok: true, message: "Message sent successfully." }, 200);
}
