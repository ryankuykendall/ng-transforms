import program from 'commander';
import ts from 'typescript';
import logger from '../utils/logger.util';
import {
  getTypescriptFileASTsFromDirectory,
  findFilesWithASTMatchingSelector,
  generateTypescriptFromTransformationResults,
} from '../utils/ast.util';
import { NgAstSelector, IFileTransformationResult } from '../interfaces/ast-file.interface';

import * as ct from './../component.transform';
import * as cdt from './../transforms/components/component-decorator.transform';
import * as compClassDecTrans from './../transforms/components/class-declaration.transform';

export const action = (dir: string, cmd: program.Command) => {
  logger.info(`Scanning ${dir}`);

  const tsFiles = getTypescriptFileASTsFromDirectory(dir);
  const componentDecoratorImportMatches = findFilesWithASTMatchingSelector(
    tsFiles,
    NgAstSelector.NgImportComponentDecoratorFromCore
  );

  const transformationResults = componentDecoratorImportMatches.map(
    ({ filepath, source, ast }): IFileTransformationResult => {
      const transformation = ts.transform(ast, [
        ct.importViewEncapsulationFromAngularCoreTransformer(),
        ct.addViewEncapsulationShadowDomToComponentDecoratorTransformer(),
        ct.inlineHTMLTemplateFromFileInComponentDecoratorTransformer(filepath),
        cdt.inlineCSSFromFileTransformer(filepath),
        compClassDecTrans.renameComponentToElement(),
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
    logger.success('Component transform');
    console.log(file);
  });
};
