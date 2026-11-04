import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const bucket = process.env.PRIVATE_S3_BUCKET;
const s3 = bucket ? new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {}),
}) : null;
const directory = path.resolve(process.env.PRIVATE_STORAGE_DIR || 'data/private');

export async function storePrivate(key: string, bytes: Buffer, mime: string) {
  if (s3 && bucket) {
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: `private/${key}`, Body: bytes, ContentType: mime, ServerSideEncryption: 'AES256' }));
    return;
  }
  if (process.env.NODE_ENV === 'production') throw new Error('PRIVATE_S3_BUCKET requis en production');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, key), bytes, { flag: 'wx' });
}

export async function readPrivate(key: string): Promise<Buffer> {
  if (s3 && bucket) {
    const result = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: `private/${key}` }));
    if (!result.Body) throw new Error('Document absent');
    return Buffer.from(await result.Body.transformToByteArray());
  }
  if (process.env.NODE_ENV === 'production') throw new Error('PRIVATE_S3_BUCKET requis en production');
  return readFile(path.join(directory, key));
}
