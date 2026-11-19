/**
 * BUILDORA 60 - Location and Utility Helpers
 */

/**
 * Safely extracts a concise area or locality label for display in headers and badges.
 * Never throws an error even if inputs are undefined, null, non-strings, or malformed.
 */
export function formatLocationDisplay(locality?: unknown, cityName?: unknown): string {
  if (typeof locality === 'string' && locality.trim().length > 0) {
    const clean = locality.trim();
    // Return first segment before slash, comma, or parenthesis
    const parts = clean.split(/[/,(]/);
    if (parts.length > 0 && parts[0].trim().length > 0) {
      return parts[0].trim();
    }
    return clean;
  }

  if (typeof cityName === 'string' && cityName.trim().length > 0) {
    const clean = cityName.trim();
    const parts = clean.split(/[/,(]/);
    if (parts.length > 0 && parts[0].trim().length > 0) {
      return parts[0].trim();
    }
    return clean;
  }

  return 'Bengaluru';
}
