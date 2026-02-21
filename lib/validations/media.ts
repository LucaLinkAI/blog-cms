import { z } from "zod";

export const BucketSchema = z.enum(["post-covers", "post-content", "avatars"]);

export const UploadMetadataSchema = z.object({
  altText: z.string().max(500).optional(),
  bucket: BucketSchema,
});

// File size limits in bytes per bucket
export const BUCKET_LIMITS: Record<
  z.infer<typeof BucketSchema>,
  { maxBytes: number; accept: string[] }
> = {
  "post-covers": {
    maxBytes: 5 * 1024 * 1024, // 5 MB
    accept: ["image/jpeg", "image/png", "image/webp"],
  },
  "post-content": {
    maxBytes: 10 * 1024 * 1024, // 10 MB
    accept: ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"],
  },
  avatars: {
    maxBytes: 2 * 1024 * 1024, // 2 MB
    accept: ["image/jpeg", "image/png", "image/webp"],
  },
};

export type UploadMetadata = z.infer<typeof UploadMetadataSchema>;
export type Bucket = z.infer<typeof BucketSchema>;
