import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { env } from './env'

const s3 = new S3Client({})

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
