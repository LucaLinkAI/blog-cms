/**
 * Supabase Seed Script (T105)
 *
 * Reads all mock fixture data from lib/data/mock/data.ts and inserts it into
 * the Supabase database using the admin client (bypasses RLS).
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SECRET_KEY=... npx ts-node -r tsconfig-paths/register supabase/seed.ts
 *   or via a custom npm/pnpm script in package.json.
 *
 * Safety: upserts on slug conflict — safe to run multiple times.
 */

import { createClient } from "@supabase/supabase-js";
import {
  mockCategories,
  mockTags,
  mockAuthors,
  mockPosts,
  mockMedia,
} from "../lib/data/mock/data";
import { MOCK_USERS } from "../lib/auth/mock";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function upsertRows<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  onConflict: string
) {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict, ignoreDuplicates: false });
  if (error) throw new Error(`Failed to upsert ${table}: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

async function seedCategories() {
  console.log("Seeding categories…");
  const rows = mockCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? null,
    color: c.color ?? null,
  }));
  await upsertRows("categories", rows, "slug");
  console.log(`  ✓ ${rows.length} categories`);
}

async function seedTags() {
  console.log("Seeding tags…");
  const rows = mockTags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
  }));
  await upsertRows("tags", rows, "slug");
  console.log(`  ✓ ${rows.length} tags`);
}

async function seedAuthors() {
  console.log("Seeding auth users + profiles…");

  // profiles.id is a FK to auth.users.id — create the auth users first.
  // Uses admin.createUser so we can supply the specific UUID and skip email confirmation.
  for (const mockUser of MOCK_USERS) {
    const { error } = await supabase.auth.admin.createUser({
      id: mockUser.profile.id,
      email: mockUser.email,
      password: mockUser.password,
      email_confirm: true,
    });
    if (error && !error.message.includes("already been registered")) {
      throw new Error(`Failed to create auth user ${mockUser.email}: ${error.message}`);
    }
  }
  console.log(`  ✓ ${MOCK_USERS.length} auth users`);

  const rows = mockAuthors.map((a) => ({
    id: a.id,
    display_name: a.displayName,
    avatar_url: a.avatarUrl ?? null,
    bio: a.bio ?? null,
    role: a.role,
    slug: a.slug,
    created_at: a.createdAt,
  }));
  // Conflict on "id" (not "slug") because the handle_new_user trigger already
  // inserted a minimal profile row when we created each auth user above.
  // We overwrite it with the full seed data (correct display_name, role, slug, etc.).
  await upsertRows("profiles", rows, "id");
  console.log(`  ✓ ${rows.length} profiles`);
}

async function seedPosts() {
  console.log("Seeding posts…");

  const postRows = mockPosts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    content: p.content ?? null,
    excerpt: p.excerpt ?? null,
    cover_image_url: p.coverImageUrl ?? null,
    author_id: p.authorId,
    category_id: p.categoryId ?? null,
    status: p.status,
    published_at: p.publishedAt ?? null,
    meta_title: p.metaTitle ?? null,
    meta_description: p.metaDescription ?? null,
    reading_time: p.readingTime ?? null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }));

  await upsertRows("posts", postRows, "slug");
  console.log(`  ✓ ${postRows.length} posts`);

  // post_tags junction
  const postTagRows: { post_id: string; tag_id: string }[] = [];
  for (const p of mockPosts) {
    for (const tagId of p.tagIds) {
      postTagRows.push({ post_id: p.id, tag_id: tagId });
    }
  }

  if (postTagRows.length > 0) {
    const { error } = await supabase
      .from("post_tags")
      .upsert(postTagRows, { onConflict: "post_id,tag_id", ignoreDuplicates: true });
    if (error) throw new Error(`Failed to upsert post_tags: ${error.message}`);
    console.log(`  ✓ ${postTagRows.length} post_tag associations`);
  }
}

async function seedMedia() {
  console.log("Seeding media…");
  const rows = mockMedia.map((m) => ({
    id: m.id,
    filename: m.filename,
    storage_path: m.storagePath,
    url: m.url,
    mime_type: m.mimeType,
    size_bytes: m.sizeBytes,
    alt_text: m.altText ?? null,
    uploaded_by: m.uploadedBy,
    created_at: m.createdAt,
  }));
  await upsertRows("media", rows, "id");
  console.log(`  ✓ ${rows.length} media items`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Starting seed…\n");

  try {
    await seedCategories();
    await seedTags();
    await seedAuthors();
    await seedPosts();
    await seedMedia();
    console.log("\nSeed complete!");
  } catch (err) {
    console.error("\nSeed failed:", err);
    process.exit(1);
  }
}

main();
