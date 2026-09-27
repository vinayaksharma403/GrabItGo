/**
 * Converts any string into a clean, URL-safe slug.
 * Safely strips or replaces all special characters (/, &, ?, %, #, +, parentheses, quotes, commas)
 * to ensure React Router never interprets slugs as nested route segments.
 */
export const validURLConvert = (name) => {
  if (!name) return "";
  return name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Generates a consistent, safe product URL given a product name and ID.
 */
export const createProductURL = (name, id) => {
  const slug = validURLConvert(name) || "product";
  const safeId = id ? String(id).trim() : "";
  return safeId ? `/product/${slug}-${safeId}` : `/product/${slug}`;
};

