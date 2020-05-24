import fs from 'fs';
import path from 'path';

export const UTF8 = 'UTF-8';

export const CSS_FILE_EXTENSION = 'css';
export const SCSS_FILE_EXTENSION = 'scss';
export const SCSS_REPLACE_REGEXP = /\.scss$/;

export enum NgExtname {
  CSS = '.css',
  HTML = '.html',
  Typescript = '.ts',
  SCSS = '.scss',
}

export const loadJSONFile = (filepath: string) => {
  return JSON.parse(fs.readFileSync(filepath, UTF8));
};

export const resolveDirectoryPathFragment = (fragment: string | undefined): string | undefined => {
  return fragment ? path.resolve(fragment) : undefined;
};
