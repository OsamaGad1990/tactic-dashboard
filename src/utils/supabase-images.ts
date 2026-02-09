/**
 * Supabase Storage Image Utilities
 * Resolves relative storage paths to full public URLs.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const AVATAR_BUCKET = 'avatars';

/**
 * Resolve a Supabase storage path to a full public URL.
 * - If the path is already a full URL (http/https), return as-is.
 * - If the path is relative (e.g., "uuid/main.png"), prepend the Supabase storage URL.
 * - If null/undefined/empty, return null.
 */
export function getFullAvatarUrl(path: string | null | undefined): string | null {
    if (!path) return null;

    // Already a full URL
    if (path.startsWith('http')) return path;

    // If path already includes the bucket name, don't append it again
    if (path.includes(`${AVATAR_BUCKET}/`)) {
        return `${SUPABASE_URL}/storage/v1/object/public/${path}`;
    }

    // Build full public storage URL
    return `${SUPABASE_URL}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
}
