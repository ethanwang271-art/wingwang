// app/api/contact/route.ts
// Receives the contact form and emails it to you with Resend.
// The API key is read from .env.local (RESEND_API_KEY), so it never goes into your code or the browser.
import { NextResponse } from "next/server";
import { Resend } from "resend";

// where the messages are delivered
const TO = "ethan.wang271@gmail.com";

// "onboarding@resend.dev" only works while you're testing: Resend only delivers it to the email on your Resend account.
// Once you verify wingwang.ca in Resend, change this to something like "wingwang <contact@wingwang.ca>".
const FROM = "wingwang contact <onboarding@resend.dev>";

// stop visitors from injecting HTML into the email
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  // hidden "website" field: real people leave it empty, bots fill it in. Pretend it worked and drop it.
  if (String(body.website ?? "").trim()) return NextResponse.json({ ok: true });

  const name = String(body.name ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 100);
  const email = String(body.email ?? "").trim().slice(0, 200);
  const message = String(body.message ?? "").trim().slice(0, 5000);

  if (!name || !email || !message) {
    return NextResponse.json({ error: "please fill in every box" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "that email doesn't look right" }, { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY is missing. Add it to .env.local and restart the dev server.");
    return NextResponse.json({ error: "the contact form isn't set up yet" }, { status: 500 });
  }

  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: FROM,
    to: TO,
    replyTo: email, // hitting "reply" in your inbox answers the visitor
    subject: `new message from ${name}`,
    html: `
      <p><strong>name:</strong> ${esc(name)}</p>
      <p><strong>email:</strong> ${esc(email)}</p>
      <p><strong>message:</strong></p>
      <p style="white-space:pre-wrap">${esc(message)}</p>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "couldn't send that, try again in a bit" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}