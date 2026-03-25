import { getServiceClient } from "@/lib/supabase/service";
import { encryptToken, decryptToken } from "@/lib/token-encryption";
import { auditLog } from "@/lib/audit-log";
import { logger } from "@/lib/logger";
import {
  GOOGLE_TOKEN_URL,
  TIKTOK_TOKEN_URL,
  LINKEDIN_TOKEN_URL,
} from "@/lib/constants";

type Provider = "google" | "tiktok" | "linkedin";

interface RefreshResult {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Refreshes an OAuth access token for the given provider.
 * Stores the new encrypted tokens in the database.
 * Returns the new decrypted access token for immediate use.
 */
export async function refreshOAuthToken(
  businessId: string,
  provider: Provider,
  encryptedRefreshToken: string
): Promise<string | null> {
  const refreshToken = decryptToken(encryptedRefreshToken);

  let result: RefreshResult | null = null;

  try {
    switch (provider) {
      case "google":
        result = await refreshGoogleToken(refreshToken);
        break;
      case "tiktok":
        result = await refreshTikTokToken(refreshToken);
        break;
      case "linkedin":
        result = await refreshLinkedInToken(refreshToken);
        break;
    }
  } catch (err) {
    logger.error(`OAuth token refresh failed for ${provider}`, {
      businessId,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }

  if (!result) return null;

  // Store new encrypted tokens
  const supabase = getServiceClient();
  const updateData: Record<string, string | null> = {
    [`${provider}_access_token`]: encryptToken(result.accessToken),
  };

  if (result.refreshToken) {
    updateData[`${provider}_refresh_token`] = encryptToken(result.refreshToken);
  }

  await supabase
    .from("businesses")
    .update(updateData)
    .eq("id", businessId);

  auditLog({
    business_id: businessId,
    action: "oauth.token_refresh",
    resource_type: "business",
    resource_id: businessId,
    details: { provider },
  });

  return result.accessToken;
}

async function refreshGoogleToken(refreshToken: string): Promise<RefreshResult | null> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) return null;

  return {
    accessToken: data.access_token,
    // Google sometimes returns a new refresh token
    refreshToken: data.refresh_token ?? undefined,
  };
}

async function refreshTikTokToken(refreshToken: string): Promise<RefreshResult | null> {
  const res = await fetch(TIKTOK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.TIKTOK_APP_ID ?? "",
      secret: process.env.TIKTOK_APP_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || data.code !== 0 || !data.data?.access_token) return null;

  return {
    accessToken: data.data.access_token,
    refreshToken: data.data.refresh_token ?? undefined,
  };
}

async function refreshLinkedInToken(refreshToken: string): Promise<RefreshResult | null> {
  const res = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.LINKEDIN_CLIENT_ID ?? "",
      client_secret: process.env.LINKEDIN_CLIENT_SECRET ?? "",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) return null;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? undefined,
  };
}

/**
 * Helper that decrypts an access token and, if an API call fails with 401,
 * automatically refreshes the token and retries.
 *
 * Returns the (possibly refreshed) access token, or null if refresh failed.
 */
export async function getValidAccessToken(
  businessId: string,
  provider: Provider,
  encryptedAccessToken: string,
  encryptedRefreshToken: string | null
): Promise<string | null> {
  const accessToken = decryptToken(encryptedAccessToken);

  // Quick validation: try a lightweight API call
  const isValid = await validateToken(provider, accessToken);
  if (isValid) return accessToken;

  // Token expired — try to refresh
  if (!encryptedRefreshToken) {
    logger.warn(`${provider} access token expired and no refresh token available`, {
      businessId,
    });
    return null;
  }

  return refreshOAuthToken(businessId, provider, encryptedRefreshToken);
}

async function validateToken(provider: Provider, accessToken: string): Promise<boolean> {
  try {
    let url: string;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };

    switch (provider) {
      case "google":
        url = "https://www.googleapis.com/oauth2/v1/tokeninfo";
        headers["Authorization"] = `Bearer ${accessToken}`;
        break;
      case "tiktok":
        // TikTok doesn't have a dedicated token validation endpoint;
        // we'll rely on refresh-on-failure in the webhook handler instead.
        return true;
      case "linkedin":
        url = "https://api.linkedin.com/v2/userinfo";
        headers["LinkedIn-Version"] = "202401";
        break;
      default:
        return true;
    }

    const res = await fetch(url!, { headers });
    return res.ok;
  } catch {
    return false;
  }
}
