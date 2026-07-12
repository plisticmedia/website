// Short tokens that should stay fully capitalised when we title-case a name.
const ACRONYMS = new Set([
  "pr", "seo", "ux", "ui", "av", "tv", "vfx", "cgi", "hr", "it", "uk", "us", "dj", "mc", "ai", "3d", "2d", "vr", "ar",
]);

/**
 * Title-cases a taxonomy name for display so the directory reads consistently
 * regardless of how categories/locations were typed on import
 * ("web development" and "Web Development" both render "Web Development"),
 * while keeping known acronyms upper-case ("PR", "SEO").
 */
export function titleCaseName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) =>
      word
        .split("-")
        .map((part) => {
          const bare = part.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (ACRONYMS.has(bare)) return part.toUpperCase();
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join("-"),
    )
    .join(" ");
}
