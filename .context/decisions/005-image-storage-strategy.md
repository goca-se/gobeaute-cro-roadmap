# ADR-005: Image Storage Strategy (Supabase Storage + Base64 Fallback)

**Status:** Accepted
**Date:** 2026-04-06
**Version:** 1.0

## Context

Tasks need to support inline image attachments (screenshots, evidence). The app has no custom backend. Images need to be persisted and accessible across sessions and users.

## Decision

Use **Supabase Storage** (bucket `task-images`) as the primary image store. When Supabase is not configured (`isConfigured === false`), fall back to **base64 data URLs** embedded directly in the task `description` HTML string.

- Storage path: `tasks/{brandId}/{reqId}/{uid}.webp`
- Images are compressed to WebP (max 1920px, quality 0.85) via Canvas API before upload
- Max file size: 2 MB (pre-compression)
- Images are stored inline in the task `description` HTML as `<img>` tags with a `data-storage-path` attribute for deletion
- Orphaned images (task deleted without removing images) are a known limitation — not cleaned up automatically

## Consequences

- **Positive:** No new dependencies. Works in both Supabase and localStorage modes. Images are portable (URL or base64).
- **Negative:** Bucket `task-images` must be created manually with correct RLS policies. Base64 images in localStorage can exhaust the 5 MB storage budget for large screenshots.

## Required Supabase Setup

```sql
CREATE POLICY "Public read task images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'task-images' );

CREATE POLICY "Authenticated users can upload task images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'task-images' );

CREATE POLICY "Authenticated users can delete task images"
ON storage.objects FOR DELETE TO authenticated
USING ( bucket_id = 'task-images' );
```

## History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-06 | Initial decision |
