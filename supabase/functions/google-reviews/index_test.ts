import {
  type CacheRecord,
  type CacheStore,
  createGoogleReviewsHandler,
  FRESH_CACHE_MS,
  getCacheState,
  HARD_EXPIRY_MS,
  normalizeGoogleReviews,
  type ReviewsPayload,
} from "./index.ts";

function assert(
  condition: unknown,
  message = "assertion failed",
): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(
  actual: unknown,
  expected: unknown,
  message = "values differ",
): void {
  const left = JSON.stringify(actual);
  const right = JSON.stringify(expected);
  if (left !== right) throw new Error(`${message}: ${left} !== ${right}`);
}

const NOW = new Date("2026-06-22T10:00:00.000Z");
const ORIGIN = "https://www.studioyogis.it";
const BUSINESS_URL = "https://www.google.com/maps/place/Studio+Yogis";

function review(index: number, overrides: Record<string, unknown> = {}) {
  return {
    reviewId: `review-${index}`,
    reviewer: {
      displayName: `Cliente ${index}`,
      profilePhotoUrl: `https://example.com/avatar-${index}.jpg`,
    },
    starRating: "FIVE",
    comment: `Recensione ${index}`,
    createTime: "2026-06-01T08:00:00.000Z",
    updateTime: "2026-06-01T08:00:00.000Z",
    ...overrides,
  };
}

function payload(overrides: Partial<ReviewsPayload> = {}): ReviewsPayload {
  return {
    source: "google_business_profile",
    attribution: "Google Maps",
    businessProfileUrl: BUSINESS_URL,
    averageRating: 4.9,
    totalReviewCount: 120,
    cachedAt: NOW.toISOString(),
    isStale: false,
    reviews: [{
      id: "review-1",
      authorName: "Cliente 1",
      rating: 5,
      comment: "Bellissimo studio",
      createTime: "2026-06-01T08:00:00.000Z",
      updateTime: "2026-06-01T08:00:00.000Z",
    }],
    ...overrides,
  };
}

class MemoryCache implements CacheStore {
  saved: CacheRecord | null = null;
  deleted = false;

  constructor(public record: CacheRecord | null) {}

  get(): Promise<CacheRecord | null> {
    return Promise.resolve(this.record);
  }

  save(record: CacheRecord): Promise<void> {
    this.saved = record;
    this.record = record;
    return Promise.resolve();
  }

  delete(): Promise<void> {
    this.deleted = true;
    this.record = null;
    return Promise.resolve();
  }
}

function cacheAt(ageMs: number): CacheRecord {
  const fetchedAt = new Date(NOW.getTime() - ageMs);
  return {
    cacheKey: "studio-yogis-google-reviews",
    payload: payload({ cachedAt: fetchedAt.toISOString() }),
    fetchedAt: fetchedAt.toISOString(),
    expiresAt: new Date(fetchedAt.getTime() + FRESH_CACHE_MS).toISOString(),
  };
}

function env(name: string): string | undefined {
  const values: Record<string, string> = {
    ALLOWED_ORIGINS: `${ORIGIN},http://localhost:8000`,
    GOOGLE_CLIENT_ID: "client-id",
    GOOGLE_CLIENT_SECRET: "client-secret",
    GOOGLE_REFRESH_TOKEN: "refresh-token",
    GBP_ACCOUNT_ID: "account-id",
    GBP_LOCATION_ID: "location-id",
    GOOGLE_BUSINESS_PROFILE_URL: BUSINESS_URL,
  };
  return values[name];
}

function request(origin = ORIGIN, method = "GET"): Request {
  return new Request("https://project.functions.supabase.co/google-reviews", {
    method,
    headers: { Origin: origin, Accept: "application/json" },
  });
}

Deno.test("normalizes the ten newest text reviews without changing their text", () => {
  const exactComment = "  Testo originale con spazi  ";
  const rawReviews = [
    review(0, { comment: "", starRating: "FIVE" }),
    review(1, { comment: exactComment }),
    review(2, { starRating: "UNKNOWN" }),
    ...Array.from({ length: 12 }, (_, index) => review(index + 3)),
  ];

  const normalized = normalizeGoogleReviews(
    {
      averageRating: 4.9,
      totalReviewCount: 120,
      reviews: rawReviews,
    },
    BUSINESS_URL,
    NOW,
  );

  assertEquals(normalized.reviews.length, 10);
  assertEquals(normalized.reviews[0].comment, exactComment);
  assert(
    normalized.reviews.every((item) => item.rating >= 1 && item.rating <= 5),
  );
  assertEquals(normalized.attribution, "Google Maps");
});

Deno.test("classifies fresh, stale and expired cache records", () => {
  assertEquals(getCacheState(cacheAt(FRESH_CACHE_MS - 1), NOW), "fresh");
  assertEquals(getCacheState(cacheAt(FRESH_CACHE_MS + 1), NOW), "stale");
  assertEquals(getCacheState(cacheAt(HARD_EXPIRY_MS), NOW), "expired");
});

Deno.test("rejects requests from an unauthorized origin", async () => {
  const handler = createGoogleReviewsHandler({
    env,
    now: () => NOW,
    cacheStore: new MemoryCache(null),
  });
  const response = await handler(request("https://example.com"));
  assertEquals(response.status, 403);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), null);
});

Deno.test("answers allowed CORS preflight requests", async () => {
  const handler = createGoogleReviewsHandler({
    env,
    now: () => NOW,
    cacheStore: new MemoryCache(null),
  });
  const response = await handler(request(ORIGIN, "OPTIONS"));
  assertEquals(response.status, 204);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), ORIGIN);
});

Deno.test("serves fresh cache without calling Google", async () => {
  let fetchCount = 0;
  const handler = createGoogleReviewsHandler({
    env,
    now: () => NOW,
    cacheStore: new MemoryCache(cacheAt(60 * 60 * 1000)),
    fetcher: () => {
      fetchCount += 1;
      return Promise.reject(new Error("fetch should not run"));
    },
  });

  const response = await handler(request());
  const body = await response.json();
  assertEquals(response.status, 200);
  assertEquals(fetchCount, 0);
  assertEquals(body.isStale, false);
});

Deno.test("fetches Google, normalizes and saves when cache is absent", async () => {
  const cache = new MemoryCache(null);
  const fetcher: typeof fetch = (input) => {
    const url = String(input);
    if (url.includes("oauth2.googleapis.com/token")) {
      return Promise.resolve(
        Response.json({ access_token: "temporary-access-token" }),
      );
    }
    if (url.includes("mybusiness.googleapis.com")) {
      return Promise.resolve(Response.json({
        averageRating: 4.9,
        totalReviewCount: 120,
        reviews: [review(1), review(2, { comment: "" })],
      }));
    }
    return Promise.reject(new Error(`unexpected URL: ${url}`));
  };

  const handler = createGoogleReviewsHandler({
    env,
    now: () => NOW,
    cacheStore: cache,
    fetcher,
  });
  const response = await handler(request());
  const body = await response.json();

  assertEquals(response.status, 200);
  assertEquals(body.reviews.length, 1);
  assert(cache.saved, "cache was not saved");
  assertEquals(cache.saved.payload.isStale, false);
});

Deno.test("serves stale cache when Google refresh fails", async () => {
  const handler = createGoogleReviewsHandler({
    env,
    now: () => NOW,
    cacheStore: new MemoryCache(cacheAt(FRESH_CACHE_MS + 1000)),
    fetcher: () =>
      Promise.resolve(new Response("unavailable", { status: 503 })),
  });

  const response = await handler(request());
  const body = await response.json();
  assertEquals(response.status, 200);
  assertEquals(body.isStale, true);
});

Deno.test("deletes hard-expired cache and returns a managed 503", async () => {
  const cache = new MemoryCache(cacheAt(HARD_EXPIRY_MS + 1000));
  const handler = createGoogleReviewsHandler({
    env,
    now: () => NOW,
    cacheStore: cache,
    fetcher: () =>
      Promise.resolve(new Response("unavailable", { status: 503 })),
  });

  const response = await handler(request());
  const body = await response.json();
  assertEquals(response.status, 503);
  assertEquals(body.error, "reviews_unavailable");
  assert(cache.deleted, "expired cache was not deleted");
});
