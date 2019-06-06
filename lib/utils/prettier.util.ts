import path from 'path';
import * as prettier from 'prettier';
import * as fileUtil from './file.util';

// This seems brittle...need to make sure this is installed
//   with executable...otherwise changing cwd will break things.
const prettierFilename = '.prettierrc';
const prettierFilepath = path.join(__dirname, '..', '..', '..', prettierFilename);
console.log('prettierrc filepath = ', prettierFilepath);
const prettierConfig = fileUtil.loadJSONFile(prettierFilepath);
// Add typescript parser config
const typescriptConfig = Object.assign({}, prettierConfig, { parser: 'typescript' });
const scssConfig = Object.assign({}, prettierConfig, { parser: 'scss' });
const angularHTMLConfig = Object.assign({}, prettierConfig, { parser: 'angular' });

export const formatTypescript = (filepath: string) => {
  return prettier.format(filepath, typescriptConfig);
};

export const formatSCSS = (filepath: string) => {
  return prettier.format(filepath, scssConfig);
};

export const formatAngularTemplate = (filepath: string) => {
  prettier.format(filepath, angularHTMLConfig);
};
