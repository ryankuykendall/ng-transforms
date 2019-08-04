import ts from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';
import fs from 'fs';
import glob from 'glob';
import path from 'path';

import {
  TS_NODE_BASE_ATTRS,
  IFileAST,
  TS_FILE_EXTNAME,
  IFileASTQueryMatch,
  IFileTransformationResult,
} from './../interfaces/ast-file.interface';

import chalk from 'chalk';
import logger from './logger.util';
import * as fileUtil from './file.util';
import * as prettierUtil from './prettier.util';

export const dumpASTNode = (
  node: ts.Node,
  index: number = 0,
  depth: number = 0,
  indent: number = 4
) => {
  const kind = ts.SyntaxKind[node.kind];
  const summary = node
    .getText()
    .replace(/\n/g, ' ')
    .substring(0, 32);
  const attrs = Object.keys(node).filter(k => !TS_NODE_BASE_ATTRS.has(k));
  if (ts.isIdentifier(node)) {
    console.log(
      `${index}.`.padStart(depth * indent, ' '),
      chalk.yellow(kind),
      chalk.bgBlueBright.black.bold(node.escapedText as string),
      attrs.join(', ')
    );
  } else {
    console.log(
      `${index}.`.padStart(depth * indent, ' '),
      chalk.yellow(kind),
      attrs.join(', '),
      summary
    );
  }
  let childIndex = 0;
  node.forEachChild((node: ts.Node) => {
    dumpASTNode(node, childIndex, depth + 1, indent);
    childIndex++;
  });
};

export const getTypescriptFileASTsFromDirectory = (dir: string): IFileAST[] => {
  let scanDirPath = dir;
  if (!path.isAbsolute(scanDirPath)) {
    scanDirPath = path.join(process.cwd(), dir);
  }

  if (!fs.existsSync(scanDirPath)) {
    logger.error(`Directory or file does not exist`, scanDirPath);
  }

  let tsFiles: string[] = [scanDirPath];
  if (path.extname(scanDirPath) !== TS_FILE_EXTNAME) {
    tsFiles = glob.sync(`${scanDirPath}/**/*.ts`);
    logger.info(`Processing files in`, scanDirPath);
  } else {
    logger.info('Processing file', scanDirPath);
  }

  return tsFiles.map(
    (filepath: string): IFileAST => {
      const source = fs.readFileSync(filepath, fileUtil.UTF8);
      const ast = tsquery.ast(source);
      return {
        filepath,
        source,
        ast,
      };
    }
  );
};

export const findFilesWithASTMatchingSelector = (
  tsFiles: IFileAST[],
  selector: string
): IFileASTQueryMatch[] => {
  const result: IFileASTQueryMatch[] = [];

  tsFiles.forEach(({ filepath, source, ast }, index) => {
    const matches = tsquery(ast, selector);

    if (matches.length > 0) {
      result.push({
        filepath,
        source,
        ast,
        matches,
      });
    }
  });

  return result;
};

export const generateTypescriptFromTransformationResults = (
  results: IFileTransformationResult[],
  pretty: boolean = false
): string[] => {
  return results.map(({ filepath, transformation }: IFileTransformationResult) => {
    const updatedComponentSFAST = transformation.transformed[0];
    const updatedFilepath = `${path.basename(filepath)}.element.ts`;
    return generateTypescriptFromSourceFileAST(updatedComponentSFAST, updatedFilepath, pretty);
  });
};

export const generateTypescriptFromSourceFileAST = (
  node: ts.SourceFile,
  filepath: string,
  pretty: boolean = false
): string => {
  // QUESTION (ryan): Is creating this new ts.SourceFile necessary?
  // const updatedComponentSFAST = transformation.transformed[0];
  const updatedSourceFile: ts.SourceFile = ts.createSourceFile(
    filepath,
    '',
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const updatedSource = ts
    .createPrinter()
    .printNode(ts.EmitHint.SourceFile, node, updatedSourceFile);

  if (pretty) {
    return prettierUtil.formatTypescript(updatedSource);
  }

  return updatedSource;
};
