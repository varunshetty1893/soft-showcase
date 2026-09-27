// lib/utils/slug.ts
// Generates URL-safe slugs from text strings.

/**
 * Converts a string to a URL-safe slug.
 * Example: "My Cool Project!" → "my-cool-project"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars (except hyphens)
    .replace(/[\s_]+/g, "-")  // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-")      // Collapse consecutive hyphens
    .replace(/^-+|-+$/g, ""); // Trim leading/trailing hyphens
}

/**
 * Generates a unique slug by appending a numeric suffix if the base slug
 * is already taken.
 *
 * @param base   - The base slug to start with
 * @param exists - A function that returns true if the slug is already in use
 */
export async function generateUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const slug = slugify(base);
  if (!(await exists(slug))) return slug;

  let counter = 2;
  while (await exists(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}
