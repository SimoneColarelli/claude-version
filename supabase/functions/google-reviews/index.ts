const CACHE_KEY = "studio-yogis-google-reviews";
export const FRESH_CACHE_MS = 24 * 60 * 60 * 1000;
export const HARD_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

const DEFAULT_ALLOWED_ORIGINS = [
  "https://studioyogis.it",
  "https://www.studioyogis.it",
];

const RATING_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export interface PublicReview {
  id: string;
  authorName: string;
  profilePhotoUrl: string;
  rating: number;
  comment: string;
  createTime: string;
  updateTime: string;
}

export interface ReviewsPayload {
  source: "google_business_profile";
  attribution: "Google Maps";
  businessProfileUrl: string;
  averageRating: number;
  totalReviewCount: number;
  cachedAt: string;
  isStale: boolean;
  reviews: PublicReview[];
}

export interface CacheRecord {
  cacheKey: string;
  payload: ReviewsPayload;
  fetchedAt: string;
  expiresAt: string;
}

export interface CacheStore {
  get(cacheKey: string): Promise<CacheRecord | null>;
  save(record: CacheRecord): Promise<void>;
  delete(cacheKey: string): Promise<void>;
}

interface HandlerOptions {
  now?: () => Date;
  fetcher?: typeof fetch;
  env?: (name: string) => string | undefined;
  cacheStore?: CacheStore;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asTimestamp(value: unknown): string {
  const timestamp = asString(value);
  return timestamp && !Number.isNaN(Date.parse(timestamp)) ? timestamp : "";
}

function asHttpsUrl(value: unknown): string {
  const candidate = asString(value);
  if (!candidate) return "";

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function normalizeGoogleReviews(
  raw: unknown,
  businessProfileUrl: string,
  cachedAt: Date,
): ReviewsPayload {
  if (!isRecord(raw)) throw new Error("invalid_google_payload");

  const averageRating = Number(raw.averageRating);
  const totalReviewCount = Number(raw.totalReviewCount);
  const safeBusinessProfileUrl = asHttpsUrl(businessProfileUrl);

  if (
    !Number.isFinite(averageRating) || averageRating < 1 || averageRating > 5
  ) {
    throw new Error("invalid_average_rating");
  }

  if (!Number.isInteger(totalReviewCount) || totalReviewCount < 0) {
    throw new Error("invalid_total_review_count");
  }

  if (!safeBusinessProfileUrl) throw new Error("invalid_business_profile_url");

  const rawReviews = Array.isArray(raw.reviews) ? raw.reviews : [];
  const reviews: PublicReview[] = [];

  for (const candidate of rawReviews) {
    if (reviews.length >= 10) break;
    if (!isRecord(candidate)) continue;

    const comment = asString(candidate.comment);
    const rating = RATING_MAP[asString(candidate.starRating)];
    const id = asString(candidate.reviewId);

    if (!id || !rating || comment.trim().length === 0) continue;

    const reviewer = isRecord(candidate.reviewer) ? candidate.reviewer : {};

    reviews.push({
      id,
      authorName: asString(reviewer.displayName),
      profilePhotoUrl: asHttpsUrl(reviewer.profilePhotoUrl),
      rating,
      comment,
      createTime: asTimestamp(candidate.createTime),
      updateTime: asTimestamp(candidate.updateTime),
    });
  }

  return {
    source: "google_business_profile",
    attribution: "Google Maps",
    businessProfileUrl: safeBusinessProfileUrl,
    averageRating,
    totalReviewCount,
    cachedAt: cachedAt.toISOString(),
    isStale: false,
    reviews,
  };
}

export function getCacheState(
  record: CacheRecord,
  now: Date,
): "fresh" | "stale" | "expired" {
  const fetchedAt = Date.parse(record.fetchedAt);
  const expiresAt = Date.parse(record.expiresAt);
  const age = now.getTime() - fetchedAt;

  if (!Number.isFinite(fetchedAt) || !Number.isFinite(expiresAt) || age < 0) {
    return "expired";
  }
  if (age >= HARD_EXPIRY_MS) return "expired";
  if (age < FRESH_CACHE_MS && now.getTime() < expiresAt) return "fresh";
  return "stale";
}

export function parseAllowedOrigins(value: string | undefined): Set<string> {
  const configured = (value || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...configured]);
}

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}

function jsonResponse(body: unknown, status: number, origin = ""): Response {
  const headers: HeadersInit = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };

  if (origin) Object.assign(headers, corsHeaders(origin));
  return new Response(JSON.stringify(body), { status, headers });
}

async function fetchWithTimeout(
  fetcher: typeof fetch,
  input: string | URL,
  init: RequestInit,
  timeoutMs = 10_000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetcher(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

class SupabaseRestCacheStore implements CacheStore {
  constructor(
    private readonly supabaseUrl: string,
    private readonly serviceRoleKey: string,
    private readonly fetcher: typeof fetch,
  ) {}

  private get headers(): HeadersInit {
    return {
      apikey: this.serviceRoleKey,
      Authorization: `Bearer ${this.serviceRoleKey}`,
      "Content-Type": "application/json",
    };
  }

  async get(cacheKey: string): Promise<CacheRecord | null> {
    const url = new URL("/rest/v1/google_reviews_cache", this.supabaseUrl);
    url.searchParams.set("cache_key", `eq.${cacheKey}`);
    url.searchParams.set("select", "cache_key,payload,fetched_at,expires_at");
    url.searchParams.set("limit", "1");

    const response = await this.fetcher(url, { headers: this.headers });
    if (!response.ok) throw new Error(`cache_read_${response.status}`);

    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0 || !isRecord(rows[0])) {
      return null;
    }

    const row = rows[0];
    if (!isRecord(row.payload)) throw new Error("cache_payload_invalid");

    return {
      cacheKey: asString(row.cache_key),
      payload: row.payload as unknown as ReviewsPayload,
      fetchedAt: asString(row.fetched_at),
      expiresAt: asString(row.expires_at),
    };
  }

  async save(record: CacheRecord): Promise<void> {
    const url = new URL("/rest/v1/google_reviews_cache", this.supabaseUrl);
    url.searchParams.set("on_conflict", "cache_key");

    const response = await this.fetcher(url, {
      method: "POST",
      headers: {
        ...this.headers,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        cache_key: record.cacheKey,
        payload: record.payload,
        fetched_at: record.fetchedAt,
        expires_at: record.expiresAt,
      }),
    });

    if (!response.ok) throw new Error(`cache_write_${response.status}`);
  }

  async delete(cacheKey: string): Promise<void> {
    const url = new URL("/rest/v1/google_reviews_cache", this.supabaseUrl);
    url.searchParams.set("cache_key", `eq.${cacheKey}`);
    const response = await this.fetcher(url, {
      method: "DELETE",
      headers: this.headers,
    });
    if (!response.ok) throw new Error(`cache_delete_${response.status}`);
  }
}

async function refreshGoogleAccessToken(
  fetcher: typeof fetch,
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<string> {
  const response = await fetchWithTimeout(
    fetcher,
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    },
  );

  if (!response.ok) throw new Error(`oauth_${response.status}`);
  const body = await response.json();
  if (!isRecord(body) || !asString(body.access_token)) {
    throw new Error("oauth_invalid_response");
  }
  return asString(body.access_token);
}

async function fetchGoogleReviews(
  fetcher: typeof fetch,
  accessToken: string,
  accountId: string,
  locationId: string,
): Promise<unknown> {
  const url = new URL(
    `https://mybusiness.googleapis.com/v4/accounts/${
      encodeURIComponent(accountId)
    }/locations/${encodeURIComponent(locationId)}/reviews`,
  );
  url.searchParams.set("pageSize", "50");
  url.searchParams.set("orderBy", "updateTime desc");

  const response = await fetchWithTimeout(fetcher, url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) throw new Error(`google_reviews_${response.status}`);
  return response.json();
}

function safeLog(code: string): void {
  console.error(`[google-reviews] ${code}`);
}

export function createGoogleReviewsHandler(options: HandlerOptions = {}) {
  const now = options.now || (() => new Date());
  const fetcher = options.fetcher || fetch;
  const env = options.env || ((name: string) => Deno.env.get(name));

  return async (request: Request): Promise<Response> => {
    const origin = (request.headers.get("origin") || "").replace(/\/$/, "");
    const allowedOrigins = parseAllowedOrigins(env("ALLOWED_ORIGINS"));

    if (!origin || !allowedOrigins.has(origin)) {
      return jsonResponse({ error: "origin_not_allowed" }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "GET") {
      const response = jsonResponse(
        { error: "method_not_allowed" },
        405,
        origin,
      );
      response.headers.set("Allow", "GET, OPTIONS");
      return response;
    }

    const supabaseUrl = env("SUPABASE_URL") || "";
    const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!options.cacheStore && (!supabaseUrl || !serviceRoleKey)) {
      safeLog("missing_supabase_configuration");
      return jsonResponse({ error: "reviews_unavailable" }, 503, origin);
    }

    const cacheStore = options.cacheStore || new SupabaseRestCacheStore(
      supabaseUrl,
      serviceRoleKey,
      fetcher,
    );

    const currentTime = now();
    let cached: CacheRecord | null = null;

    try {
      cached = await cacheStore.get(CACHE_KEY);
    } catch {
      safeLog("cache_read_failed");
    }

    if (cached && getCacheState(cached, currentTime) === "fresh") {
      return jsonResponse({ ...cached.payload, isStale: false }, 200, origin);
    }

    try {
      const clientId = env("GOOGLE_CLIENT_ID") || "";
      const clientSecret = env("GOOGLE_CLIENT_SECRET") || "";
      const refreshToken = env("GOOGLE_REFRESH_TOKEN") || "";
      const accountId = env("GBP_ACCOUNT_ID") || "";
      const locationId = env("GBP_LOCATION_ID") || "";
      const businessProfileUrl = env("GOOGLE_BUSINESS_PROFILE_URL") || "";

      if (
        !clientId || !clientSecret || !refreshToken || !accountId ||
        !locationId || !businessProfileUrl
      ) {
        throw new Error("missing_google_configuration");
      }

      const accessToken = await refreshGoogleAccessToken(
        fetcher,
        clientId,
        clientSecret,
        refreshToken,
      );
      const googlePayload = await fetchGoogleReviews(
        fetcher,
        accessToken,
        accountId,
        locationId,
      );
      const normalized = normalizeGoogleReviews(
        googlePayload,
        businessProfileUrl,
        currentTime,
      );
      const freshUntil = new Date(currentTime.getTime() + FRESH_CACHE_MS)
        .toISOString();

      try {
        await cacheStore.save({
          cacheKey: CACHE_KEY,
          payload: normalized,
          fetchedAt: currentTime.toISOString(),
          expiresAt: freshUntil,
        });
      } catch {
        safeLog("cache_write_failed");
      }

      return jsonResponse(normalized, 200, origin);
    } catch {
      safeLog("google_refresh_failed");

      if (cached && getCacheState(cached, currentTime) === "stale") {
        return jsonResponse({ ...cached.payload, isStale: true }, 200, origin);
      }

      if (cached) {
        try {
          await cacheStore.delete(CACHE_KEY);
        } catch {
          safeLog("expired_cache_delete_failed");
        }
      }

      return jsonResponse(
        {
          error: "reviews_unavailable",
          message: "Google reviews temporarily unavailable",
        },
        503,
        origin,
      );
    }
  };
}

if (import.meta.main) {
  Deno.serve(createGoogleReviewsHandler());
}
