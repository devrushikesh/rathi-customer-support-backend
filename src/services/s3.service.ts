import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand, GetObjectCommand, type ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import path from "node:path";

// --- CONFIGURATION ---
const REGION = process.env.AWS_REGION || "ap-south-1";
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const DEFAULT_BUCKET = process.env.AWS_BUCKET_NAME || "rathi-engineering-issues";

if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) throw new Error("AWS credentials not set");

// --- S3 Client Instance ---
const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

// --- TYPE DEFINITIONS ---
export interface PresignedPostResult {
  fileName: string;
  url: string;
  fields: Record<string, string>;
}

export interface PresignedUrlResult {
  fileName: string;
  url: string;
}

// --- FILE SIZE LIMITS ---
const IMAGE_MAX_SIZE = 10 * 1024 * 1024;  // 10 MB
const VIDEO_MAX_SIZE = 30 * 1024 * 1024;  // 30 MB

function getMaxSizeLimit(fileName: string, contentType?: string): number {
  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  const videoExts = [".mp4", ".mov", ".avi", ".mkv"];
  const ext = path.extname(fileName).toLowerCase();

  if (imageExts.includes(ext) || (contentType && contentType.startsWith("image/"))) {
    return IMAGE_MAX_SIZE;
  }
  if (videoExts.includes(ext) || (contentType && contentType.startsWith("video/"))) {
    return VIDEO_MAX_SIZE;
  }
  // Default to 10MB if unknown
  return IMAGE_MAX_SIZE;
}

// --- GENERATE PRESIGNED POST URL for upload with size limit ---
export async function generatePresignedPostUrl(
  bucketName: string,
  fileName: string,
  contentType: string = "application/octet-stream",
  expiresIn: number = 300 // 5 minutes
): Promise<PresignedPostResult> {
  const maxSize = getMaxSizeLimit(fileName, contentType);

  const { url, fields } = await createPresignedPost(s3, {
    Bucket: bucketName,
    Key: fileName,
    Conditions: [
      ["content-length-range", 1, maxSize],
      { "Content-Type": contentType }
    ],
    Fields: { "Content-Type": contentType },
    Expires: expiresIn,
  });
  return { fileName, url, fields };
}

// --- GENERATE MULTIPLE PRESIGNED POST URLs ---
export async function generateMultiplePresignedPostUrls(
  files: { fileName: string; contentType?: string }[],
  tempId: string,
  bucketName: string = DEFAULT_BUCKET,
  expiresIn: number = 300
): Promise<PresignedPostResult[]> {
  return Promise.all(files.map(file =>
    generatePresignedPostUrl(
      bucketName,
      `temp/${tempId}/${file.fileName}`,
      file.contentType || "application/octet-stream",
      expiresIn
    )
  ));
}

// --- GENERATE PRESIGNED GET URL for download ---
export async function generateGetPresignedUrl(
  fileName: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: DEFAULT_BUCKET, Key: fileName });
  return getSignedUrl(s3, command, { expiresIn });
}

// --- MOVE FOLDER LOGIC ---
export async function moveFolder(
  bucket: string,
  sourcePrefix: string,
  targetPrefix: string
): Promise<string[]> {
  let continuationToken: string | undefined = undefined;
  const movedKeys: string[] = [];
  let imageCount = 1, videoCount = 1, fileCount = 1;

  do {
    const list: ListObjectsV2CommandOutput = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: sourcePrefix, ContinuationToken: continuationToken })
    );

    if (!list.Contents) break;

    for (const obj of list.Contents) {
      if (!obj.Key) continue;

      const sourceKey = obj.Key;
      const ext = path.extname(sourceKey).toLowerCase();

      let newFileName: string;
      if ([".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext)) {
        newFileName = `image${imageCount++}${ext}`;
      } else if ([".mp4", ".mov", ".avi", ".mkv"].includes(ext)) {
        newFileName = `video${videoCount++}${ext}`;
      } else {
        newFileName = `file${fileCount++}${ext}`;
      }

      const targetKey = `${targetPrefix}${newFileName}`;

      await s3.send(new CopyObjectCommand({ Bucket: bucket, CopySource: `${bucket}/${sourceKey}`, Key: targetKey }));
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: sourceKey }));

      movedKeys.push(targetKey);
      console.log(`Moved & Renamed: ${sourceKey} → ${targetKey}`);
    }

    continuationToken = list.NextContinuationToken;
  } while (continuationToken);

  return movedKeys;
}
