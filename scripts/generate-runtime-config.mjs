import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const outputPath = resolve('public/runtime-config.js');
const token = process.env.MAPBOX_PUBLIC_TOKEN?.trim() ?? '';

if (token && !token.startsWith('pk.')) {
  throw new Error(
    'MAPBOX_PUBLIC_TOKEN must be a public Mapbox token (pk.*). Secret tokens (sk.*) must never be bundled in a browser application.',
  );
}

const config = JSON.stringify({ mapboxPublicToken: token }).replaceAll('<', '\\u003c');
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `/** Generated at build time. Do not edit. */\nwindow.__LOST_ANIMALS_CONFIG__ = Object.freeze(${config});\n`,
  'utf8',
);
