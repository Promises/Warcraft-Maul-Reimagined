import fs from "fs";
import path from "path";

const templatePath = path.resolve(__dirname, "../config.json.template");
const configPath = path.resolve(__dirname, "../config.json");

if (!fs.existsSync(configPath)) {
  console.log("config.json not found. Creating from template...");
  fs.copyFileSync(templatePath, configPath);
  console.log("config.json created.");
} else {
  console.log("config.json already exists. Skipping creation.");
}
