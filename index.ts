#!/usr/bin/env node

import program from 'commander';
import ts from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';

import * as ct from './lib/component.transform';
import * as cdt from './lib/transforms/components/component-decorator.transform';
import * as compClassDecTrans from './lib/transforms/components/class-declaration.transform';
import * as fileUtil from './lib/utils/file.util';
// TODO (ryan): Wrap-up chalk with console.log && console.error into a separate module
//   (and likely a singleton) to control output velocity levels across command runs.
//   Add verbosity level as an option to general command flags.
import logger from './lib/utils/logger.util';

import * as fs from 'fs';
import * as path from 'path';

/** COMMAND IMPORTS */
import { action as dumpASTAction } from './lib/commands/dump-ast.command';
import { action as dumpClassesAction } from './lib/commands/dump-classes.command';
import { action as dumpEnumsAction } from './lib/commands/dump-enums.command';
import { action as dumpImportsAction } from './lib/commands/dump-imports.command';
import { action as dumpInterfacesAction } from './lib/commands/dump-interfaces.command';

import { action as dumpComponentClassDecoratorsAction } from './lib/commands/dump-component-class-decorators.command';
import { action as dumpDirectiveClassDecoratorsAction } from './lib/commands/dump-directive-class-decorators.command';
import { action as dumpNgModuleClassDecoratorsAction } from './lib/commands/dump-ng-module-class-decorators.command';

import { action as queryCommandAction } from './lib/commands/query.command';
import { action as ngMetadataCollectAction } from './lib/commands/ng-metadata-collect.command';
import { action as ngMetadataKeyAction } from './lib/commands/ng-metadata-key.command';
import { action as ngMetadataQueryAction } from './lib/commands/ng-metadata-query.command';
import { action as ngInlineResourcesAction } from './lib/commands/ng-inline-resources.command';
import { action as ngCreateComponentLookupAction } from './lib/commands/ng-create-component-lookup.command';
import { action as ngGenerateModuleAction } from './lib/commands/ng-generate-module.command';

import {
  getTypescriptFileASTsFromDirectory,
  findFilesWithASTMatchingSelector,
  generateTypescriptFromTransformationResults,
  generateTypescriptFromSourceFileAST,
} from './lib/utils/ast.util';
import {
  NgAstSelector,
  IFileTransformationResult,
  IFileASTQueryMatch,
} from './lib/interfaces/ast-file.interface';

const packageJSON = fileUtil.loadJSONFile('package.json');
program.version(packageJSON.version);

const printer: ts.Printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
});

// TODO (ryan): Clean this file up by moving each of the command functions into their
//   own files in lib/cli/command.
program.command('dump-ast <dir>').action(dumpASTAction);

program
  .command('query <selector> <dir>')
  .option('-a --ancestor <ancestor>', 'Backtrack to first ancestor of SyntaxKind')
  .action(queryCommandAction);

program.command('dump-imports <dir>').action(dumpImportsAction);
program.command('dump-classes <dir>').action(dumpClassesAction);
program.command('dump-enums <dir>').action(dumpEnumsAction);
program.command('dump-interfaces <dir>').action(dumpInterfacesAction);
program.command('dump-directives <dir>').action(dumpDirectiveClassDecoratorsAction);
program.command('dump-components <dir>').action(dumpComponentClassDecoratorsAction);
program.command('dump-ng-modules <dir>').action(dumpNgModuleClassDecoratorsAction);

program
  .command('component-transform-add-view-encapsulation-shadow-dom <dir>')
  .action((dir: string, cmd: program.Command) => {
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
  });

program
  .command('ng-inline-resources <dir>')
  .option('-R --rewrite', 'Rewrite file sources from transform')
  .option('-s --src <source>', 'Source directory root')
  .option('-b --build <build>', 'Build directory root')
  .option(
    '-c --css-build <css-build-dir>',
    'Build directory root for CSS files transpiled from SCSS'
  )
  .option(
    '-t --template-build <template-build-dir>',
    'Build directory root for component template HTML files'
  )
  .option('-p --pretty', 'Output files through Prettier')
  .action(ngInlineResourcesAction);

program
  .command('wrap-component-in-namespace <namespace> <dir>')
  .description('Wraps Component class decorations in a namespace.')
  .action((namespace: string, dir: string, cmd: program.Command) => {
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
  });

program
  .command('ng-metadata-collect <dir>')
  .option('-o --output <output>', 'Output file name for metadata file')
  .option('-v --verbose', 'Verbosity level')
  .description('Scans typescript files in a directory to pull out classes, interfaces, and enums')
  .action(ngMetadataCollectAction);

program
  .command('ng-metadata-key <filepath>')
  .option('-o --output <output>', 'Output file name for metadata query results file')
  .option('-d --depth <depth>', 'Limit key output to specified depth')
  .option('-i --indent <indent>', 'Indentation level')
  .description(
    'Generates an abbreviated interface key to facility the use of json-query syntax in ng-metadata-query command.'
  )
  .action(ngMetadataKeyAction);

program
  .command('ng-metadata-query <query> <filepath>')
  .option('-o --output <output>', 'Output file name for metadata file')
  .description('Queries the file output of ng-metadata-collect using json-query syntax')
  .action(ngMetadataQueryAction);

program
  .command('ng-create-component-lookup <filepath>')
  .option('-o --output <output>', 'Output filepath to write lookup to.')
  .option('-r --relative <relative>', 'Relative filepath to use to prune source filepath')
  .description(
    'Generate lookup between Directive and Component selectors and their class definitions'
  )
  .action(ngCreateComponentLookupAction);

program
  .command('ng-generate-module <filepath>')
  .option(
    '-s --module-stub <module-stub-filepath>',
    'The module stub file to use as a starting point'
  )
  .option('-o --output <output>', 'Output filepath to write lookup to.')
  .option('-r --relative <relative>', 'Relative filepath to use to prune absolute source filepath')
  .option('-m --import-modules', 'Import all modules from metadata file')
  .option('-d --import-directives', 'Import all directives from metadata file')
  .option('-c --import-components', 'Import all components from metadata file')
  .option('-a --import-all', 'Import all modules, directives, and components from metadata file')
  .description('Generate NgModule from a collection of components and directives')
  .action(ngGenerateModuleAction);

program.parse(process.argv);
