import { exec } from 'child_process';
import type { APIRoute } from 'astro';

const execAsync = (cmd: string) => {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout) => {
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });
};

export const prerender = false;

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

  return new Response(output, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': output.length.toString(),
      'Cache-Control': 'no-store',
    },
  });
};
