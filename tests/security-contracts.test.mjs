import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWorkspaceFile = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("contact endpoint uses a server-backed hashed rate limit", async () => {
  const source = await readWorkspaceFile("app/api/contact/route.ts");
  assert.match(source, /createHash\("sha256"\)/);
  assert.match(source, /check_contact_rate_limit/);
  assert.doesNotMatch(source, /rateLimitStore/);
});

test("Python APIs reject wildcard CORS origins", async () => {
  const sources = await Promise.all([
    readWorkspaceFile("ml-backend/utils/config.py"),
    readWorkspaceFile("skin-backend/main.py"),
    readWorkspaceFile("career-backend/main.py"),
  ]);

  for (const source of sources) {
    assert.match(source, /wildcards are not allowed/);
  }
});

test("analytics are opt-in and omit raw IP collection", async () => {
  const source = await readWorkspaceFile("lib/trackActivity.ts");
  assert.match(source, /NEXT_PUBLIC_ANALYTICS_ENABLED/);
  assert.doesNotMatch(source, /ipapi\.co|ip_address|country_name/);
});
