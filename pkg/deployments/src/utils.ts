import * as fs from 'fs';

export function parseFileSync(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath).toString());
}
