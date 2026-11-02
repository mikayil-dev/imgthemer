import { execFile } from 'child_process';
import { createReadStream, createWriteStream, unlink } from 'fs';
import { pipeline } from 'stream/promises';
import { palettes } from '@assets/scripts/palettes';
import { trackUmamiEvent } from 'src/lib/umami';
import type { APIRoute } from 'astro';

export const prerender = false;

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

// Image types lutgen can read. The type comes from the client, so it is checked
// against this list before it becomes part of a file name.
const FILE_TYPE = /^image\/(png|jpe?g|webp|gif|bmp|tiff)$/;

// Runs a program without a shell, so no argument can inject commands.
function execFileAsync(file: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(file, args, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
}

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  const file = data.get('file') as File;
  const theme = data.get('theme') ?? 'nord';

  if (!file || !(file instanceof Blob)) {
    void trackUmamiEvent(
      {
        url: '/api/img',
        name: 'img_conversion_failed',
        data: { reason: 'file_missing or not instance of Blob' },
      },
      request,
    );
    return new Response(JSON.stringify({ message: 'File missing.' }), {
      status: 400,
    });
  }

  if (file.size > MAX_FILE_SIZE) {
    void trackUmamiEvent(
      {
        url: '/api/img',
        name: 'img_conversion_failed',
        data: { reason: 'file_too_large', fileSize: file.size },
      },
      request,
    );
    return new Response(
      JSON.stringify({ message: 'File is too large. Maximum size is 15MB.' }),
      { status: 413 },
    );
  }

  if (typeof theme !== 'string' || !palettes.includes(theme)) {
    void trackUmamiEvent(
      {
        url: '/api/img',
        name: 'img_conversion_failed',
        data: { reason: 'invalid_theme', theme },
      },
      request,
    );
    return new Response(JSON.stringify({ message: 'Theme corrupted.' }), {
      status: 400,
    });
  }

  const fileType = FILE_TYPE.exec(file.type)?.[1];
  if (!fileType) {
    void trackUmamiEvent(
      {
        url: '/api/img',
        name: 'img_conversion_failed',
        data: { reason: 'unsupported_file_type' },
      },
      request,
    );
    return new Response(
      JSON.stringify({
        message:
          'Unsupported file type. Use PNG, JPEG, WebP, GIF, BMP or TIFF.',
      }),
      { status: 415 },
    );
  }

  const originalId = crypto.randomUUID();
  const originalFilePath = `/tmp/${originalId}.${fileType}`;

  void trackUmamiEvent(
    {
      url: '/api/img',
      name: 'img_conversion_started',
      data: { originalId, fileType, theme },
    },
    request,
  );

  const modifiedFilePath = `/tmp/${crypto.randomUUID()}.${fileType}`;

  try {
    await pipeline(file.stream(), createWriteStream(originalFilePath));

    await execFileAsync('lutgen', [
      'apply',
      '--palette',
      theme,
      originalFilePath,
      '--output',
      modifiedFilePath,
    ]);

    const fileStream = createReadStream(modifiedFilePath);
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => {
          controller.close();
          unlink(originalFilePath, () => 0);
          unlink(modifiedFilePath, () => 0);
        });
        fileStream.on('error', (err) => {
          controller.error(err);
          unlink(originalFilePath, () => 0);
          unlink(modifiedFilePath, () => 0);
        });
      },
      // The visitor closed the connection before the image was sent.
      cancel() {
        fileStream.destroy();
        unlink(originalFilePath, () => 0);
        unlink(modifiedFilePath, () => 0);
      },
    });

    void trackUmamiEvent(
      {
        url: '/api/img',
        name: 'img_conversion_completed',
        data: { originalId, fileType, theme },
      },
      request,
    );

    return new Response(webStream, {
      headers: {
        'Content-Type': file.type,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Server error occured while converting Image:\n', err);
    unlink(originalFilePath, () => 0);
    unlink(modifiedFilePath, () => 0);

    void trackUmamiEvent(
      {
        url: '/api/img',
        name: 'img_conversion_failed',
        data: { reason: 'server_error', originalId, fileType, theme },
      },
      request,
    );

    return new Response(
      JSON.stringify({ message: 'An unexpected Server error occured.' }),
      { status: 500 },
    );
  }
};
