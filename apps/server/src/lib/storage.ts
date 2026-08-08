import { mkdir, writeFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import type { Readable } from 'node:stream';
import { Storage, type Bucket } from '@google-cloud/storage';
import { ValidationError } from './errors.js';

/**
 * Object storage with two backends behind one small seam (putBuffer/putStream below), selected by
 * STORAGE_BACKEND ('local', the default, or 'gcs'):
 *  - local: writes to apps/server/uploads/ and serves it back via modules/uploads/routes.ts.
 *  - gcs: writes to a real Google Cloud Storage bucket - needs GCS_BUCKET_NAME plus credentials
 *    (either GCS_CREDENTIALS_JSON inline, or the standard GOOGLE_APPLICATION_CREDENTIALS file-path
 *    convention @google-cloud/storage already knows how to read on its own). This environment has
 *    neither a real GCP project nor credentials to test against, so the gcs path is implemented
 *    and type-checked but unverified against a live bucket - flipping STORAGE_BACKEND once real
 *    credentials exist is the entire activation step, no code change needed.
 * Every caller gets back a plain URL string either way and never knows which backend served it.
 */
export const UPLOADS_DIR = join(process.cwd(), 'uploads');

function isGcsBackend(): boolean {
  return process.env.STORAGE_BACKEND === 'gcs';
}

function publicBaseUrl(): string {
  return process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
}

let gcsBucket: Bucket | null = null;

function getGcsBucket(): Bucket {
  if (!gcsBucket) {
    const bucketName = process.env.GCS_BUCKET_NAME;
    if (!bucketName) throw new Error('GCS_BUCKET_NAME is required when STORAGE_BACKEND=gcs');

    // GCS_CREDENTIALS_JSON is an inline service-account key - handy on platforms where mounting a
    // credentials file isn't convenient. If unset, the SDK falls back to its normal Application
    // Default Credentials resolution (GOOGLE_APPLICATION_CREDENTIALS file path, workload identity, etc).
    const credentialsJson = process.env.GCS_CREDENTIALS_JSON;
    const storage = credentialsJson ? new Storage({ credentials: JSON.parse(credentialsJson) }) : new Storage();
    gcsBucket = storage.bucket(bucketName);
  }
  return gcsBucket;
}

async function putBuffer(key: string, data: Buffer, contentType: string): Promise<string> {
  if (isGcsBackend()) {
    const bucket = getGcsBucket();
    await bucket.file(key).save(data, { contentType, resumable: false });
    return `https://storage.googleapis.com/${bucket.name}/${key}`;
  }

  const filePath = join(UPLOADS_DIR, key);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
  return `${publicBaseUrl()}/uploads/${key}`;
}

async function putStream(key: string, stream: Readable, contentType: string): Promise<string> {
  if (isGcsBackend()) {
    const bucket = getGcsBucket();
    const file = bucket.file(key);
    await pipeline(stream, file.createWriteStream({ contentType, resumable: true }));
    return `https://storage.googleapis.com/${bucket.name}/${key}`;
  }

  const filePath = join(UPLOADS_DIR, key);
  await mkdir(dirname(filePath), { recursive: true });
  await pipeline(stream, createWriteStream(filePath));
  return `${publicBaseUrl()}/uploads/${key}`;
}

const IMAGE_DATA_URI_PATTERN = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/;

export function isBase64ImageDataUri(value: string): boolean {
  return IMAGE_DATA_URI_PATTERN.test(value);
}

/** Decodes a `data:image/...;base64,...` URI and stores it - returns a URL the client can use
 * exactly like it used the base64 string before, no client-side change needed to adopt this. */
export async function putBase64Image(dataUri: string, folder: string): Promise<string> {
  const match = IMAGE_DATA_URI_PATTERN.exec(dataUri);
  if (!match) throw new ValidationError('Expected a base64 image data URI');

  const [, subtype, base64Data] = match;
  const ext = subtype === 'jpg' ? 'jpeg' : subtype;
  const key = `${folder}/${randomUUID()}.${ext}`;
  return putBuffer(key, Buffer.from(base64Data, 'base64'), `image/${ext}`);
}

const VIDEO_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

export function isSupportedVideoMimeType(mimeType: string): boolean {
  return mimeType in VIDEO_EXTENSION_BY_MIME_TYPE;
}

/** Streams an uploaded video straight to storage without buffering the whole file in memory -
 * exercise videos can be tens of MB, unlike the small base64 avatar images above. */
export async function putVideoStream(stream: Readable, folder: string, mimeType: string): Promise<string> {
  const ext = VIDEO_EXTENSION_BY_MIME_TYPE[mimeType];
  if (!ext) throw new ValidationError(`Unsupported video type: ${mimeType}`);

  const key = `${folder}/${randomUUID()}.${ext}`;
  return putStream(key, stream, mimeType);
}
