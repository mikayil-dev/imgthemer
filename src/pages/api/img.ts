import { spawn } from 'child_process';
import type { APIRoute } from 'astro';

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

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  // spawn lutgen in streaming mode:
  // We use --input -     → read from STDIN
  //     --output /dev/stdout → write binary to STDOUT
  const child = spawn('lutgen', [
    'apply',
    '--palette',
    'gruvbox-dark-hard',
    '-', // read stdin
    '--output',
    './output.jpg', // write stdout
  ]);

  // Write the uploaded file into lutgen's stdin
  child.stdin.write(inputBuffer);
  child.stdin.end();

  // Collect output from stdout
  const chunks: Buffer[] = [];

  return await new Promise((resolve) => {
    child.stdout.on('data', (chunk: Buffer<ArrayBufferLike>) => {
      console.log(chunk);
      chunks.push(chunk);
    });

    child.stderr.on('data', (err) => {
      console.error('lutgen error:', err);
    });

    child.on('close', (code) => {
      console.log('CLOSING CODE:', code);
      if (code !== 0) {
        resolve(
          new Response(
            JSON.stringify({ error: `lutgen exited with code ${code}` }),
            { status: 500 },
          ),
        );
        return;
      }

      const output = Buffer.concat(chunks);

      resolve(
        new Response(output, {
          status: 200,
          headers: {
            'Content-Type': 'image/png',
            'Content-Length': output.length.toString(),
            'Cache-Control': 'no-store',
          },
        }),
      );
    });
  });
};
