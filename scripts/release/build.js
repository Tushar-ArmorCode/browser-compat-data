/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import fs from 'node:fs/promises';
import path from 'node:path';

import esMain from 'es-main';
import stringify from 'fast-json-stable-stringify';

import bumpData from './mirror.js';
import { walk } from '../../utils/index.js';

const packageJson = JSON.parse(
  await fs.readFile(new URL('../../package.json', import.meta.url), 'utf-8'),
);

const directory = './build/';

const verbatimFiles = ['LICENSE', 'README.md', 'types.d.ts'];

// Returns a string representing data ready for writing to JSON file
async function createDataBundle() {
  const { default: bcd } = await import('../../index.js');

  const walker = walk(undefined, bcd);

  for (const feature of walker) {
    for (const [browser, supportData] of Object.entries(
      feature.compat.support,
    )) {
      if (supportData === 'mirror') {
        feature.data.__compat.support[browser] = bumpData(
          browser,
          feature.compat.support,
        );
      }
    }
  }

  const string = stringify({
    ...bcd,
    __meta: { version: packageJson.version },
  });
  return string;
}

// Returns a promise for writing the data to JSON file
async function writeData() {
  const dest = path.resolve(directory, 'data.json');
  const data = await createDataBundle();
  await fs.writeFile(dest, data);
}

async function writeWrapper() {
  const dest = path.resolve(directory, 'legacynode.mjs');
  const content = `// A small wrapper to allow ESM imports on older NodeJS versions that don't support import assertions
import fs from 'node:fs';
const bcd = JSON.parse(fs.readFileSync(new URL('./data.json', import.meta.url)));
export default bcd;
`;
  await fs.writeFile(dest, content);
}

async function writeTypeScriptIndex() {
  const dest = path.resolve(directory, 'index.ts');
  const content = `/* This file is a part of @mdn/browser-compat-data
 * See LICENSE file for more information. */

import { CompatData } from "./types";

import bcd from "./data.json";

export default bcd as CompatData;
export * from "./types";`;
  await fs.writeFile(dest, content);
}

// Returns an array of promises for copying of all files that don't need transformation
async function copyFiles() {
  for (const file of verbatimFiles) {
    const src = path.join('./', file);
    const dest = path.join(directory, file);
    await fs.copyFile(src, dest);
  }
}

async function createManifest() {
  const minimal = {
    main: 'data.json',
    exports: {
      '.': './data.json',
      './forLegacyNode': './legacynode.mjs',
    },
    types: 'index.ts',
  };

  const minimalKeys = [
    'name',
    'version',
    'description',
    'repository',
    'keywords',
    'author',
    'license',
    'bugs',
    'homepage',
  ];

  for (const key of minimalKeys) {
    if (key in packageJson) {
      minimal[key] = packageJson[key];
    } else {
      throw `Could not create a complete manifest! ${key} is missing!`;
    }
  }
  return JSON.stringify(minimal);
}

async function writeManifest() {
  const dest = path.resolve(directory, 'package.json');
  const manifest = await createManifest();
  await fs.writeFile(dest, manifest);
}

async function main() {
  // Remove existing files, if there are any
  await fs
    .rm(directory, {
      force: true,
      recursive: true,
    })
    .catch((e) => {
      // Missing folder is not an issue since we wanted to delete it anyway
      if (e.code !== 'ENOENT') throw e;
    });

  // Crate a new directory
  await fs.mkdir(directory);

  await writeManifest();
  await writeData();
  await writeWrapper();
  await writeTypeScriptIndex();
  await copyFiles();

  console.log('Data bundle is ready');
}

if (esMain(import.meta)) {
  await main();
}
