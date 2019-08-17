import program from 'commander';
import ts from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';
import logger from '../utils/logger.util';
import fs from 'fs';
import path from 'path';

import * as dm from './../declaration-metadata/index.metadata';
import {
  getTypescriptFileASTsFromDirectory,
  findFilesWithASTMatchingSelector,
} from './../utils/ast.util';
import { NgAstSelector, IFileASTQueryMatch } from './../interfaces/ast-file.interface';
import { getRootMetadataStub } from './../declaration-metadata/root.metadata';

export const action = (dir: string, cmd: program.Command) => {
  logger.info(`Scanning ${dir}`);

  const outputFile = cmd.opts()['output'] ? path.resolve(cmd.opts()['output']) : null;
  // TODO (ryan): Implement verbosity!
  const verbose = cmd.opts()['verbose'] || false;

  const tsFiles = getTypescriptFileASTsFromDirectory(dir);
  let interfaceMatches = findFilesWithASTMatchingSelector(tsFiles, NgAstSelector.NgInterfaces);
  interfaceMatches = interfaceMatches.filter((fileMatch: IFileASTQueryMatch) => {
    // Filter out all of the test files/specs.
    // TODO (ryan): Make this more robust. Using a regex for test
    //   in the ModuleSpecifier may be overly broad.
    const testResults = tsquery(
      fileMatch.ast,
      NgAstSelector.ImportDeclarationWithTestInModuleSpecifier
    );
    return testResults.length === 0;
  });

  const interfaces: dm.IRootMetadata = getRootMetadataStub();

  // TODO (ryan): Update this to stop using a transform to drive the visitor pattern.
  const transformationResults = interfaceMatches.forEach(({ filepath, source, ast }) => {
    ts.transform(ast, [dm.collectMetadata(interfaces, filepath, dm.rootCollectorCallback)]);
  });

  const jsonOutput = JSON.stringify(interfaces, null, 2);
  if (outputFile) {
    logger.info('Saving metadata file to', outputFile);
    fs.writeFileSync(outputFile, jsonOutput);
  } else {
    console.log(jsonOutput);
  }
};
