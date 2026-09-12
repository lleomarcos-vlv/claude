function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  authSecret: process.env.AUTH_SECRET || "",
  storageDriver: (process.env.STORAGE_DRIVER || "local") as "local" | "supabase" | "s3",
  uploadDir: process.env.UPLOAD_DIR || "./storage/uploads",
  image: {
    format: (process.env.IMAGE_VARIANT_FORMAT || "webp") as "webp" | "avif",
    desktopWidth: num(process.env.IMAGE_DESKTOP_WIDTH, 1600),
    mobileWidth: num(process.env.IMAGE_MOBILE_WIDTH, 800),
    thumbWidth: num(process.env.IMAGE_THUMB_WIDTH, 480),
    desktopQuality: num(process.env.IMAGE_DESKTOP_QUALITY, 86),
    mobileQuality: num(process.env.IMAGE_MOBILE_QUALITY, 82),
    thumbQuality: num(process.env.IMAGE_THUMB_QUALITY, 80),
  },
  limits: {
    imageBytes: num(process.env.MAX_IMAGE_MB, 25) * 1024 * 1024,
    videoBytes: num(process.env.MAX_VIDEO_MB, 200) * 1024 * 1024,
  },
  supabase: {
    url: (process.env.SUPABASE_URL || "").replace(/\/$/, ""),
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    bucket: process.env.SUPABASE_BUCKET || "villa-reis",
  },
  s3: {
    bucket: process.env.S3_BUCKET || "",
    region: process.env.S3_REGION || "us-east-1",
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    endpoint: (process.env.S3_ENDPOINT || "").replace(/\/$/, ""),
    publicUrl: (process.env.S3_PUBLIC_URL || "").replace(/\/$/, ""),
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || "true") === "true",
  },
};
