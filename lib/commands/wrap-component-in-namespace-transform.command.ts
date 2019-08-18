import program from 'commander';
import ts from 'typescript';
import logger from './../utils/logger.util';
import * as compClassDecTrans from './../transforms/components/class-declaration.transform';
import {
  getTypescriptFileASTsFromDirectory,
  generateTypescriptFromTransformationResults,
} from './../utils/ast.util';
import { IFileTransformationResult } from './../interfaces/ast-file.interface';

export const action = (namespace: string, dir: string, cmd: program.Command) => {
  logger.info('Wrapping components in namespaces', namespace);
  logger.info(`Scanning ${dir}`);
  const namespaceItems = namespace.split('.');
  logger.info('Namespace items', ...namespaceItems);

  const tsFiles = getTypescriptFileASTsFromDirectory(dir);
  const transformationResults: IFileTransformationResult[] = tsFiles.map(
    ({ filepath, source, ast }): IFileTransformationResult => {
      const transformation = ts.transform(ast, [
        // Create copy of namespaceItems so we do not mutate it here.
        compClassDecTrans.placeInNamespace([...namespaceItems]),
      ]) as ts.TransformationResult<ts.SourceFile>;

      return {
        filepath,
        source,
        ast,
        transformation,
      };
    }
  );

  const outputTSFiles: string[] = generateTypescriptFromTransformationResults(
    transformationResults,
    true
  );

  outputTSFiles.forEach((file: string) => {
    logger.success('Component wrapped in namespace', namespace);
    console.log(file);
  });
};
