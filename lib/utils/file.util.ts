import fs from 'fs';
import path from 'path';

export const UTF8 = 'UTF-8';

export const loadJSONFile = (filepath: string) => {
  return JSON.parse(fs.readFileSync(filepath, UTF8));
};

export const resolveDirectoryPathFragment = (fragment: string | undefined): string | undefined => {
  return fragment ? path.resolve(fragment) : undefined;
};
