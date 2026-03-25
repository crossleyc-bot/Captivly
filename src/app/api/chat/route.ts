import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";
import { getServiceClient } from "@/lib/supabase/service";
import { badRequest, notFound, forbidden, internalError } from "@/lib/error-handler";
import type Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "@/types/database";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 500;

/**
 * Public chat endpoint for the embeddable widget.
 *
 * Visitors on a Pro customer's website can chat with an AI that knows
 * about the business. Messages are stored in chat_conversations.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    business_id: string;
    conversation_id?: string;
    message: string;
    visitor_name?: string;
    visitor_email?: string;
  };

  const { business_id, message, visitor_name, visitor_email } = body;

  if (!business_id || !message) {
    return badRequest("business_id and message are required");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return badRequest(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);
  }

  const supabase = getServiceClient();

  // Verify business exists, is Pro, and has widget enabled
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, type, primary_offer, user_id")
    .eq("id", business_id)
    .single();

  if (!business) {
    return notFound("Business not found");
  }

  const { data: user } = await supabase
    .from("users")
    .select("plan_tier, subscription_status")
    .eq("id", business.user_id)
    .single();

  if (!user || user.plan_tier !== "pro" || user.subscription_status !== "active") {
    return forbidden("Widget not available");
  }

  const { data: widgetConfig } = await supabase
    .from("chat_widget_config")
    .select("is_enabled")
    .eq("business_id", business_id)
    .single();

  if (!widgetConfig?.is_enabled) {
    return forbidden("Widget not enabled");
  }

  // Load or create conversation
  let conversationId = body.conversation_id;
  let previousMessages: ChatMessage[] = [];

  if (conversationId) {
    const { data: convo } = await supabase
      .from("chat_conversations")
      .select("messages")
      .eq("id", conversationId)
      .eq("business_id", business_id)
      .single();

    if (convo) {
      previousMessages = (convo.messages as ChatMessage[]) ?? [];
    } else {
      conversationId = undefined;
    }
  }

  // Enforce message limit
  if (previousMessages.length >= MAX_MESSAGES) {
    return NextResponse.json(
      { error: "Conversation limit reached. Please start a new chat." },
      { status: 429 }
    );
  }

  // Build Claude messages
  const systemPrompt = `You are a helpful assistant for ${business.name}, a ${business.type} business${business.primary_offer ? ` currently promoting "${business.primary_offer}"` : ""}.

Your role:
- Answer questions about the business warmly and helpfully
- Encourage visitors to take action (book, visit, sign up)
- If someone seems interested, suggest they share their name and email so the business can follow up
- Keep responses concise (2-3 sentences max)
- Never make up specific details you don't know (hours, prices, etc.) — instead, suggest the visitor contact the business directly
- Be friendly and conversational`;

  const claudeMessages: Anthropic.MessageParam[] = [
    ...previousMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const client = getAnthropicClient();
  let assistantText: string;
  try {
    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 256,
      messages: claudeMessages,
      system: systemPrompt,
    });

    assistantText = response.content
      .filter(
        (block): block is Anthropic.TextBlock => block.type === "text"
      )
      .map((block) => block.text)
      .join("");
  } catch (err) {
    console.error("Chat widget Claude API error:", err);
    return internalError("Failed to generate response. Please try again.");
  }

  const now = new Date().toISOString();
  const newMessages: ChatMessage[] = [
    ...previousMessages,
    { role: "user", content: message, timestamp: now },
    { role: "assistant", content: assistantText, timestamp: now },
  ];

  // Save conversation
  if (conversationId) {
    await supabase
      .from("chat_conversations")
      .update({
        messages: newMessages,
        visitor_name: visitor_name ?? undefined,
        visitor_email: visitor_email ?? undefined,
        updated_at: now,
      })
      .eq("id", conversationId);
  } else {
    const { data: newConvo } = await supabase
      .from("chat_conversations")
      .insert({
        business_id,
        visitor_name: visitor_name ?? null,
        visitor_email: visitor_email ?? null,
        messages: newMessages,
      })
      .select("id")
      .single();

    conversationId = newConvo?.id;
  }

  return NextResponse.json({
    reply: assistantText,
    conversation_id: conversationId,
  });
}
