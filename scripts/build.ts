import * as fs from "fs-extra";
import * as path from "path";
import War3Map from "mdx-m3-viewer-th/dist/cjs/parsers/w3x/map"
import { compileMap, getFilesInDirectory, loadJsonFile, logger, toArrayBuffer, IProjectConfig } from "./utils";
import {execFile, execSync} from "child_process";

function main() {
  const config: IProjectConfig = loadJsonFile("config.json");
  const minify = process.argv[2] === '-minify' || config.minifyScript

  if(minify !== config.minifyScript){
    logger.warn(`minifyScript has been overridden by command line argument "-minify"`)
    config.minifyScript = minify
  }


  const result = compileMap(config);

  if (!result) {
    logger.error(`Failed to compile map.`);
    return;
  }

  logger.info(`Creating w3x archive...`);
  if (!fs.existsSync(config.outputFolder)) {
    fs.mkdirSync(config.outputFolder);
  }

  createMapFromDir(`${config.outputFolder}/${config.mapFolder}`, `./dist/${config.mapFolder}`);
  //
  // const cwd = process.cwd();
  // const filename = `${cwd}/dist/bin/map.w3x`;
  //
  // logger.info(`Launching map "${filename.replace(/\\/g, "/")}"...`);
  //
  // if(config.winePath) {
  //   const wineFilename = `"Z:${filename}"`
  //   const prefix = config.winePrefix ? `WINEPREFIX=${config.winePrefix}` : ''
  //   execSync(`${prefix} ${config.winePath} "${config.gameExecutable}" ${["-loadfile", wineFilename, ...config.launchArgs].join(' ')}`, { stdio: 'ignore' });
  // } else {
  //   execFile(config.gameExecutable, ["-loadfile", filename, ...config.launchArgs], (err: any) => {
  //     if (err && err.code === 'ENOENT') {
  //       logger.error(`No such file or directory "${config.gameExecutable}". Make sure gameExecutable is configured properly in config.json.`);
  //     }
  //   });
  // }
}

/** The map name a dev build (WCM_DEV=1) carries, so a dev map is never taken for a release. */
const DEV_MAP_NAME = 'Warcraft Maul: DEV build';
const RELEASE_MAP_NAME = /^Warcraft Maul: Reimagined v[\d.]+$/m;

/** The string table with the map name swapped for the dev one; other files unchanged. */
function devNamed(archivePath: string, contents: Buffer): Buffer {
  if (process.env.WCM_DEV !== '1' || archivePath.toLowerCase() !== 'war3map.wts') {
    return contents;
  }
  const text = contents.toString('latin1');
  if (!RELEASE_MAP_NAME.test(text)) {
    logger.warn('Dev build: the map name was not found in war3map.wts, leaving it as is');
    return contents;
  }
  logger.info(`Dev build: map named "${DEV_MAP_NAME}"`);
  return Buffer.from(text.replace(RELEASE_MAP_NAME, DEV_MAP_NAME), 'latin1');
}

/** The editor's own map files; everything else in the folder is an import. */
function isMapDataFile(archivePath: string): boolean {
  const name = archivePath.toLowerCase();
  return name.startsWith('war3map') || name === 'conversation.json';
}

/**
 * The import manager listing (war3map.imp) for the editor. The game reads imports straight
 * from the archive, but the editor only shows and keeps files that are listed here, so the
 * list is generated from the archive contents instead of being maintained by hand (it had
 * drifted: files missing, files long deleted).
 * Format: version 1, count, then per file a flag byte and a zero-terminated path; flag 29
 * is what the editor writes for imports kept at their full custom path.
 */
function buildImportList(imports: string[]): ArrayBuffer {
  const CUSTOM_PATH = 29;
  const entries = imports.map(name => Buffer.concat([Buffer.from([CUSTOM_PATH]), Buffer.from(name, 'latin1'), Buffer.from([0])]));
  const header = Buffer.alloc(8);
  header.writeUInt32LE(1, 0);
  header.writeUInt32LE(imports.length, 4);
  return toArrayBuffer(Buffer.concat([header, ...entries]));
}

/**
 * Creates a w3x archive from a directory
 * @param output The output filename
 * @param dir The directory to create the archive from
 */
export function createMapFromDir(output: string, dir: string) {
  const map = new War3Map();
  const files = getFilesInDirectory(dir);

  map.archive.resizeHashtable(files.length + 1);

  const imports: string[] = [];
  for (const fileName of files) {
    // The game looks map files up by the exact path string (no separator normalisation), so
    // the archive, TOC entries and every path in code use backslashes like Blizzard's tools.
    const archivePath = path.relative(dir, fileName).split(path.sep).join('\\');
    const contents = toArrayBuffer(devNamed(archivePath, fs.readFileSync(fileName)));
    if (archivePath.toLowerCase() === 'war3map.imp') {
      // Regenerated below from what is actually in the archive
      continue;
    }
    if (!isMapDataFile(archivePath)) {
      imports.push(archivePath);
    }
    const imported = map.import(archivePath, contents);

    if (!imported) {
      logger.warn("Failed to import " + archivePath);
      continue;
    }
  }
  map.import('war3map.imp', buildImportList(imports));

  let result: ArrayBuffer | null;
  try {
    result = map.save();
  } catch (error) {
    // war3map.w3i in a format the parser does not know (the World Editor writes 39, this repo
    // keeps 31): the map information is only read to decide whether to prepend the header that
    // maps before 1.31 carry, which this map does not need, so the archive is written directly.
    logger.warn(`Could not read war3map.w3i (${error}); writing the archive without a map header.`);
    result = map.archive.save();
  }

  if (!result) {
    logger.error("Failed to save archive.");
    return;
  }

  fs.writeFileSync(output, new Uint8Array(result));

  logger.info("Finished!");
}

main();
