import { type ExecException, exec } from 'child_process';
import { createReadStream, createWriteStream, unlink } from 'fs';
import { pipeline } from 'stream/promises';
import { palettes } from '@assets/scripts/palettes';
import { trackUmamiEvent } from 'src/lib/umami';
import type { APIRoute } from 'astro';

export const prerender = false;

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

function execAsync(cmd: string): Promise<ExecException | null | string> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout) => {
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

  const originalId = crypto.randomUUID();
  const fileType = file.type.split('/').pop();
  const originalFilePath = `/tmp/${originalId}.${fileType}`;

  void trackUmamiEvent(
    {
      url: '/api/img',
      name: 'img_conversion_started',
      data: { originalId, fileType, theme },
    },
    request,
  );

  await pipeline(file.stream(), createWriteStream(originalFilePath));

  try {
    const modifiedId = crypto.randomUUID();
    const modifiedFilePath = `/tmp/${modifiedId}.${fileType}`;

    await execAsync(
      `lutgen apply --palette ${theme} ${originalFilePath} --output ${modifiedFilePath}`,
    );

    const fileStream = createReadStream(modifiedFilePath);
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => {
          controller.close();
          unlink(originalFilePath, () => 0);
          unlink(modifiedFilePath, () => 0);
        });
        fileStream.on('error', (err) => controller.error(err));
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
