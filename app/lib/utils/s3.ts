import {
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import s3Client, {
  MEDIA_BUCKET_NAME,
  MEDIA_FOLDER,
} from "../config/s3";

export async function uploadToMediaS3(buffer: Buffer,key: string,contentType: string,): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: MEDIA_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
  });
  const response = await s3Client.send(command);
  console.log("Response recieved from media bucket", response);
  return key; 
}

export function generateMediaKey(originalFileName: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const ext = originalFileName.split(".").pop()?.toLowerCase() || "jpg"; //extension
  const sanitized = originalFileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .toLowerCase()
    .substring(0, 80);

  const uuid =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `t-${Date.now()}`;

  return `${MEDIA_FOLDER}/${year}/${month}/${uuid}-${sanitized}.${ext}`;
}

export function getMediaPublicUrl(key: string): string {
  const region = process.env.AWS_REGION || " ";
  return `https://${MEDIA_BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
}

export async function deleteMediaFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: MEDIA_BUCKET_NAME,
    Key: key,
  });
  await s3Client.send(command);
}
