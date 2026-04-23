import { storage } from "../firebase";
import { randomUUID } from "crypto";

const dataUrlRegex = /^data:(?<mime>[^;]+);base64,(?<data>.+)$/;

const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET || undefined);

export async function storeImagesAsUrls(images: string[], prefix = "cases"): Promise<string[]> {
  if (!Array.isArray(images) || images.length === 0) return [];

  const uploads = images.slice(0, 8).map(async (image, index) => {
    try {
      const match = dataUrlRegex.exec(image);
      if (!match?.groups?.data || !match.groups.mime) return null;
      const mimeType = match.groups.mime;
      const buffer = Buffer.from(match.groups.data, "base64");
      const ext = mimeType.split("/")[1] || "jpg";
      const filename = `${prefix}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${index}.${ext}`;
      const file = bucket.file(filename);
      await file.save(buffer, {
        contentType: mimeType,
        resumable: false,
        public: true,
        metadata: { cacheControl: "public,max-age=31536000" }
      });
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 1000 * 60 * 60 * 24 * 365
      });
      return url;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(uploads);
  return results.filter((url): url is string => Boolean(url));
}
