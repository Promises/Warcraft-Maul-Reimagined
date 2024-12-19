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

/**
 * Creates a w3x archive from a directory
 * @param output The output filename
 * @param dir The directory to create the archive from
 */
export function createMapFromDir(output: string, dir: string) {
  const map = new War3Map();
  const files = getFilesInDirectory(dir);

  map.archive.resizeHashtable(files.length);

  for (const fileName of files) {
    const contents = toArrayBuffer(fs.readFileSync(fileName));
    const archivePath = path.relative(dir, fileName);
    const imported = map.import(archivePath, contents);

    if (!imported) {
      logger.warn("Failed to import " + archivePath);
      continue;
    }
  }

  const result = map.save();

  if (!result) {
    logger.error("Failed to save archive.");
    return;
  }

  fs.writeFileSync(output, new Uint8Array(result));

  logger.info("Finished!");
}

main();
