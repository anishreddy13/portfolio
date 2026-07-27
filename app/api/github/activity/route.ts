import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GITHUB_USER = process.env.GITHUB_STATS_USER || "anishreddy13";
const DAYS = 30;

interface GithubEvent {
  type: string;
  created_at: string;
  payload?: {
    commits?: unknown[];
  };
}

function emptyBuckets() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: DAYS }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (DAYS - 1 - index));
    return {
      date: date.toISOString(),
      events: 0,
      commits: 0,
    };
  });
}

function bucketKey(date: string) {
  return new Date(date).toISOString().slice(0, 10);
}

function isRecent(date: string) {
  const created = new Date(date).getTime();
  return Number.isFinite(created) && Date.now() - created <= DAYS * 24 * 60 * 60 * 1000;
}

export async function GET() {
  const buckets = emptyBuckets();
  const byDate = new Map(buckets.map((bucket) => [bucketKey(bucket.date), bucket]));

  try {
    const response = await fetch(`https://api.github.com/users/${GITHUB_USER}/events/public?per_page=100`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "portfolio-stats",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`GitHub returned ${response.status}`);
    }

    const events = (await response.json()) as GithubEvent[];

    events.filter((event) => isRecent(event.created_at)).forEach((event) => {
      const bucket = byDate.get(bucketKey(event.created_at));
      if (!bucket) return;

      bucket.events += 1;
      if (event.type === "PushEvent") {
        bucket.commits += Array.isArray(event.payload?.commits)
          ? event.payload?.commits.length || 1
          : 1;
      }
    });

    const totalCommits = buckets.reduce((sum, bucket) => sum + bucket.commits, 0);
    const activeDays = buckets.filter((bucket) => bucket.events > 0).length;
    const lastEventAt = events[0]?.created_at || null;

    return NextResponse.json({
      ok: true,
      user: GITHUB_USER,
      activity: buckets,
      stats: {
        commits: totalCommits,
        activeDays,
        events: buckets.reduce((sum, bucket) => sum + bucket.events, 0),
        lastEventAt,
      },
    });
  } catch (error) {
    console.error("GitHub activity fetch failed:", error);
    return NextResponse.json(
      {
        ok: false,
        user: GITHUB_USER,
        activity: buckets,
        stats: {
          commits: 0,
          activeDays: 0,
          events: 0,
          lastEventAt: null,
        },
      },
      { status: 200 }
    );
  }
}
