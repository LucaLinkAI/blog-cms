/**
 * Convert any string to a URL-friendly slug.
 * Lowercases, replaces non-alphanumeric characters with hyphens,
 * and collapses multiple consecutive hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-") // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a numeric suffix (-2, -3, …)
 * until the slug is not in the `existing` set.
 */
export function generateUniqueSlug(
  base: string,
  existing: string[]
): string {
  const existingSet = new Set(existing);
  const baseSlug = slugify(base);

  if (!existingSet.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  while (existingSet.has(`${baseSlug}-${counter}`)) {
    counter++;
  }
  return `${baseSlug}-${counter}`;
}
