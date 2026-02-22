/**
 * Mock authentication helpers for Phase 1 (no live Supabase).
 * Uses the same 5 author profiles from the mock fixture data.
 */
import type { Author } from "@/lib/data/types";

interface MockUser {
  email: string;
  password: string;
  profile: Author;
}

export const MOCK_USERS: MockUser[] = [
  {
    email: "admin@example.com",
    password: "password123",
    profile: {
      id: "a1b2c3d4-0001-4001-8001-000000000001",
      displayName: "Alex Rivera",
      avatarUrl: "https://picsum.photos/seed/alex/200/200",
      bio: "Platform administrator and full-stack engineer.",
      role: "admin",
      slug: "alex-rivera",
      createdAt: "2025-01-01T00:00:00Z",
    },
  },
  {
    email: "editor@example.com",
    password: "password123",
    profile: {
      id: "a1b2c3d4-0002-4002-8002-000000000002",
      displayName: "Sam Chen",
      avatarUrl: "https://picsum.photos/seed/sam/200/200",
      bio: "Senior editor and technical writer.",
      role: "editor",
      slug: "sam-chen",
      createdAt: "2025-01-15T00:00:00Z",
    },
  },
  {
    email: "author1@example.com",
    password: "password123",
    profile: {
      id: "a1b2c3d4-0003-4003-8003-000000000003",
      displayName: "Maya Patel",
      avatarUrl: "https://picsum.photos/seed/maya/200/200",
      bio: "Frontend engineer and design systems enthusiast.",
      role: "author",
      slug: "maya-patel",
      createdAt: "2025-02-01T00:00:00Z",
    },
  },
  {
    email: "author2@example.com",
    password: "password123",
    profile: {
      id: "a1b2c3d4-0004-4004-8004-000000000004",
      displayName: "Jordan Kim",
      avatarUrl: "https://picsum.photos/seed/jordan/200/200",
      bio: "Backend engineer specializing in distributed systems.",
      role: "author",
      slug: "jordan-kim",
      createdAt: "2025-02-15T00:00:00Z",
    },
  },
  {
    email: "author3@example.com",
    password: "password123",
    profile: {
      id: "a1b2c3d4-0005-4005-8005-000000000005",
      displayName: "Taylor Brooks",
      avatarUrl: "https://picsum.photos/seed/taylor/200/200",
      bio: "Product manager turned developer.",
      role: "author",
      slug: "taylor-brooks",
      createdAt: "2025-03-01T00:00:00Z",
    },
  },
];

export function getMockUser(email: string): Author | null {
  const user = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  return user?.profile ?? null;
}

export function validateMockCredentials(
  email: string,
  password: string
): Author | null {
  const user = MOCK_USERS.find(
    (u) =>
      u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  return user?.profile ?? null;
}

/** Check whether an email is already registered. */
export function mockEmailExists(email: string): boolean {
  return MOCK_USERS.some(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
}

/** Append a new mock user (used by admin registration). */
export function addMockUser(
  email: string,
  password: string,
  profile: Author
): void {
  MOCK_USERS.push({ email, password, profile });
}
