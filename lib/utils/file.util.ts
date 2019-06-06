import fs from 'fs';

export const UTF8 = 'UTF-8';

export const loadJSONFile = (filepath: string) => {
  return JSON.parse(fs.readFileSync(filepath, UTF8));
};
