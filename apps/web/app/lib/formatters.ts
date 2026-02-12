
/**
 * Formats content text for display.
 * 
 * Transformations:
 * 1. Replaces em dashes (—) with regular dashes (-).
 * 2. Replaces en dashes (–) with regular dashes (-).
 */
export function formatContentText(text: string | null | undefined): string {
    if (!text) return "";

    return text
        .replace(/\u2014/g, "-")  // em dash
        .replace(/\u2013/g, "-"); // en dash
}
