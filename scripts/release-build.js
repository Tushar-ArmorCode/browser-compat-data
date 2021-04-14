'use strict';

const fs = require('fs').promises;
const path = require('path');

const directory = './build/';

const verbatimFiles = ['LICENSE', 'README.md', 'index.d.ts', 'types.d.ts'];

// Returns a string representing data ready for writing to JSON file
function createDataBundle() {
  const bcd = require('../index.js');
  const string = JSON.stringify(bcd);
  return string;
}

// Returns a promise for writing the data to JSON file
async function writeData() {
  const dest = path.resolve('./', directory, './data.json');
  const data = createDataBundle();
  await fs.writeFile(dest, data);
}

// Returns an array of promises for copying of all files that don't need transformation
async function copyFiles() {
  for (const file of verbatimFiles) {
    const src = path.join('./', file);
    const dest = path.join(directory, file);
    await fs.copyFile(src, dest);
  }
}

function createManifest() {
  const full = require('../package.json');
  const minimal = {};

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
    'types',
  ];

  for (const key of minimalKeys) {
    if (key in full) {
      minimal[key] = full[key];
    } else {
      throw `Could not create a complete manifest! ${key} is missing!`;
    }
  }
  return JSON.stringify(minimal);
}

async function writeManifest() {
  const dest = path.resolve('./', directory, './package.json');
  const manifest = createManifest();
  await fs.writeFile(dest, manifest);
}

async function main() {
  // Remove existing files, if there are any
  const deletedDir = await fs.rm(directory, {
    force: true,
    recursive: true,
  });
  if (deletedDir !== undefined) throw deletedDir;

  // Crate a new directory
  await fs.mkdir(directory);

  await writeManifest();
  await writeData();
  await copyFiles();

  console.log('Data bundle is ready');
}

// This is needed because NodeJS does not support top-level await.
// Do not catch errors so that NodeJS fails on them.
main().catch(e => {
  console.error(e);
  process.exit(1);
});
