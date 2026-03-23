import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, message } = body as {
    name: string;
    email: string;
    message: string;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
    return NextResponse.json({ error: "Name is required (max 100 characters)" }, { status: 400 });
  }

  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  if (!message || typeof message !== "string" || message.trim().length === 0 || message.length > 5000) {
    return NextResponse.json({ error: "Message is required (max 5000 characters)" }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { error } = await supabase.from("contact_submissions").insert({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
  });

  if (error) {
    return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
