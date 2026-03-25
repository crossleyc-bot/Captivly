import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { badRequest, internalError } from "@/lib/error-handler";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, email, message } = body as {
    name: string;
    email: string;
    message: string;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
    return badRequest("Name is required (max 100 characters)");
  }

  if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return badRequest("A valid email is required");
  }

  if (!message || typeof message !== "string" || message.trim().length === 0 || message.length > 5000) {
    return badRequest("Message is required (max 5000 characters)");
  }

  const supabase = getServiceClient();

  const { error } = await supabase.from("contact_submissions").insert({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
  });

  if (error) {
    return internalError("Failed to submit message");
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
