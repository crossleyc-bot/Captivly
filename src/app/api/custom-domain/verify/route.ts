import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolve } from "dns/promises";

/**
 * POST /api/custom-domain/verify — verify domain ownership via DNS TXT record
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const { data: domainRecord } = await supabase
    .from("custom_domains")
    .select("*")
    .eq("business_id", business.id)
    .single();

  if (!domainRecord) {
    return NextResponse.json({ error: "No domain configured" }, { status: 404 });
  }

  if (domainRecord.verified) {
    return NextResponse.json({ verified: true, already_verified: true });
  }

  // Check DNS TXT records for verification token
  try {
    const records = await resolve(domainRecord.domain, "TXT");
    const flatRecords = records.flat();

    const found = flatRecords.some(
      (record) => record === domainRecord.verification_token
    );

    if (!found) {
      return NextResponse.json({
        verified: false,
        message: `TXT record not found. Add a TXT record for ${domainRecord.domain} with value: ${domainRecord.verification_token}`,
      });
    }

    // Mark as verified
    await supabase
      .from("custom_domains")
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", domainRecord.id);

    // Update white_label_config
    await supabase
      .from("white_label_config")
      .update({
        custom_domain: domainRecord.domain,
        custom_domain_verified: true,
      })
      .eq("business_id", business.id);

    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json({
      verified: false,
      message: `Could not resolve DNS for ${domainRecord.domain}. Ensure TXT record is set.`,
    });
  }
}
