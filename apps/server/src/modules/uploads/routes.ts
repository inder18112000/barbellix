import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { UPLOADS_DIR } from '../../lib/storage.js';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
};

/** Serves whatever lib/storage.ts's putBase64Image()/putVideoStream() wrote to disk when
 * STORAGE_BACKEND=local (GCS-backed uploads are served directly from their storage.googleapis.com
 * URL and never hit this route at all) - a minimal read-only static file route rather than a new
 * dependency, since this is a stand-in for real object storage, not a general-purpose static file
 * server. Publicly readable by design: uploaded avatars/exercise media are meant to be viewable by
 * anyone with the URL, same as they were as inline base64 before.
 *
 * Range-request support (206 Partial Content) is required, not optional, for video: browser
 * <video> tags and native players commonly refuse to play at all - not just lose seeking - against
 * a server that doesn't honor Range headers. */
export default async function uploadsRoutes(fastify: FastifyInstance) {
  fastify.get('/uploads/*', async (request, reply) => {
    const wildcard = (request.params as { '*': string })['*'];
    const relativePath = normalize(wildcard);
    if (relativePath.startsWith('..') || relativePath.includes(`..${'/'}`)) {
      return reply.status(400).send({ message: 'Invalid path' });
    }

    const filePath = join(UPLOADS_DIR, relativePath);
    let fileSize: number;
    try {
      fileSize = (await stat(filePath)).size;
    } catch {
      return reply.status(404).send({ message: 'Not found' });
    }

    const contentType = MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
    reply.header('Content-Type', contentType);
    reply.header('Cache-Control', 'public, max-age=31536000, immutable');
    reply.header('Accept-Ranges', 'bytes');

    const rangeHeader = request.headers.range;
    const rangeMatch = rangeHeader ? /^bytes=(\d*)-(\d*)$/.exec(rangeHeader) : null;

    if (!rangeMatch) {
      reply.header('Content-Length', fileSize);
      return reply.send(createReadStream(filePath));
    }

    const [, startStr, endStr] = rangeMatch;
    const start = startStr ? Number(startStr) : 0;
    const end = endStr ? Number(endStr) : fileSize - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= fileSize) {
      reply.header('Content-Range', `bytes */${fileSize}`);
      return reply.status(416).send();
    }

    reply.status(206);
    reply.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    reply.header('Content-Length', end - start + 1);
    return reply.send(createReadStream(filePath, { start, end }));
  });
}
