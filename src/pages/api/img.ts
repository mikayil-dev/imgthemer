import { type ExecException, exec } from 'child_process';
import { createReadStream, createWriteStream, unlink } from 'fs';
import { pipeline } from 'stream/promises';
import type { APIRoute } from 'astro';

export const prerender = false;

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

  if (!file || typeof theme !== 'string') {
    return new Response(
      JSON.stringify({ message: 'file missing or theme corrupted' }),
      {
        status: 400,
      },
    );
  }

  // TODO: Write file to disk temporarily
  // Read file into command
  // output into antoher temp file serve back to user
  // delete temp files

  const originalId = crypto.randomUUID();
  const fileType = file.type.split('/').pop();
  const originalFilePath = `/tmp/${originalId}.${fileType}`;

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

    return new Response(webStream, {
      headers: {
        'Content-Type': file.type,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Server error occured while converting Image:\n', err);

    return new Response(
      JSON.stringify({ message: 'An unexpected Server error occured.' }),
    );
  }
};
