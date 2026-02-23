import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

/**
 * Upload a buffer to R2 and return the public URL.
 */
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
}

/**
 * Delete an object from R2 by its key.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    }),
  );
}

export interface R2ObjectSummary {
  key: string;
  lastModified?: Date;
  size?: number;
}

/**
 * List objects in R2 for a prefix.
 */
export async function listR2Objects(prefix: string): Promise<R2ObjectSummary[]> {
  const client = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME!;

  const objects: R2ObjectSummary[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    );

    for (const entry of response.Contents ?? []) {
      if (!entry.Key) continue;
      objects.push({
        key: entry.Key,
        lastModified: entry.LastModified,
        size: entry.Size,
      });
    }

    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return objects;
}

/**
 * Extract the R2 key from a public URL.
 */
export function getKeyFromUrl(url: string): string | null {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN;
  if (!publicDomain || !url.startsWith(publicDomain)) return null;
  return url.replace(`${publicDomain}/`, '');
}
