import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tickets, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }

  return NextResponse.json(tickets);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { subject, message, urgency } = body as {
    subject: string;
    message: string;
    urgency: string;
  };

  if (!subject || typeof subject !== "string" || subject.trim().length === 0 || subject.length > 200) {
    return NextResponse.json({ error: "Subject is required (max 200 characters)" }, { status: 400 });
  }

  if (!message || typeof message !== "string" || message.trim().length === 0 || message.length > 5000) {
    return NextResponse.json({ error: "Message is required (max 5000 characters)" }, { status: 400 });
  }

  const validUrgencies = ["low", "medium", "high"];
  const ticketUrgency = validUrgencies.includes(urgency) ? urgency : "medium";

  // Get user's business if exists
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: user.id,
      business_id: business?.id ?? null,
      subject: subject.trim(),
      message: message.trim(),
      urgency: ticketUrgency,
      status: "open",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }

  return NextResponse.json(ticket, { status: 201 });
}
