import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from './env'

const s3 = new S3Client({})

/** Presigned PUT for direct browser/app uploads into the assets bucket. */
export async function presignUpload(
  key: string,
  contentType: string,
  expiresIn = 600,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: env.assetsBucket,
      Key: key,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
    { expiresIn },
  )
  return { uploadUrl, publicUrl: `${env.assetsBase}/${key}` }
}

export async function assetExists(key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: env.assetsBucket, Key: key }))
    return true
  } catch {
    return false
  }
}

export async function putAsset(key: string, body: Buffer, contentType: string): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.assetsBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  )
  return `${env.assetsBase}/${key}`
}

export const assetUrl = (key: string): string => `${env.assetsBase}/${key}`
