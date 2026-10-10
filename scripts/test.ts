import {exec, execFile, execSync} from "child_process";
import * as fs from "fs";
import * as path from "path";
import {loadJsonFile, logger, compileMap, IProjectConfig} from "./utils";

/**
 * The map to launch. By default the map is compiled and its folder (dist/<mapFolder>) is
 * launched. With "launchBuiltMap": true in config.json nothing is compiled, and the archive
 * the last `npm run build` wrote (<outputFolder>/<mapFolder>) is launched instead: games since
 * the October 2026 update only load archives (e.g. `npm run build:dev && npm run test`).
 */
function mapToLaunch(config: IProjectConfig): string | undefined {
  if (config.launchBuiltMap) {
    const archive = path.resolve(config.outputFolder, config.mapFolder);
    if (!fs.existsSync(archive)) {
      logger.error(`No map at "${archive}"; run 'npm run build' first.`);
      return undefined;
    }
    return archive;
  }

  const result = compileMap(config);

  if (!result) {
    logger.error(`Failed to compile map.`);
    return undefined;
  }

  const cwd = process.cwd();
  return `${cwd}/dist/${config.mapFolder}`;
}

function main() {
  const config: IProjectConfig = loadJsonFile("config.json");
  const filename = mapToLaunch(config);

  if (!filename) {
    return;
  }

  logger.info(`Launching map "${filename.replace(/\\/g, "/")}"...`);

  if(config.winePath) {
    const wineFilename = `"Z:${filename}"`
    const prefix = config.winePrefix ? `WINEPREFIX=${config.winePrefix}` : ''
    execSync(`${prefix} ${config.winePath} "${config.gameExecutable}" ${["-loadfile", wineFilename, ...config.launchArgs].join(' ')}`, { stdio: 'ignore' });
  } else {
    execFile(config.gameExecutable, ["-loadfile", filename, ...config.launchArgs], (err: any) => {
      if (err && err.code === 'ENOENT') {
        logger.error(`No such file or directory "${config.gameExecutable}". Make sure gameExecutable is configured properly in config.json.`);
      }
    });
  }
}

main();
