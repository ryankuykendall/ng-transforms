import program from 'commander';
import fs from 'fs';
import * as fileUtil from './../utils/file.util';
import glob from 'glob';
import path from 'path';
import { tsquery } from '@phenomnomnominal/tsquery';
import logger from '../utils/logger.util';
import { dumpASTNode } from '../utils/ast.util';

export const action = (dir: string, cmd: program.Command) => {
  const scanDirPath = path.join(process.cwd(), dir);
  logger.info(`Scanning files in`, scanDirPath);

  if (!fs.existsSync(scanDirPath)) {
    logger.error(`Directory does note exist`, scanDirPath);
  }

  const tsFiles = glob.sync(`${scanDirPath}/**/*.ts`);
  tsFiles.forEach((filepath: string) => {
    const source = fs.readFileSync(filepath, fileUtil.UTF8);
    const ast = tsquery.ast(source);
    const nodes = tsquery(ast, `ImportDeclaration`);
    nodes.forEach((node, index) => {
      logger.newline(2);
      logger.info(' - Processing file', filepath, '\n');
      dumpASTNode(node, index);
    });
  });
};
