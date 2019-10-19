#!/usr/bin/env node

import program from 'commander';
import * as fileUtil from './lib/utils/file.util';

/**
 * TODO (ryan): Do a pass at renaming these commands to provide better
 *   consistency and simplification including choice of verbs, position of
 *   verbs, etc. For example:
 *
 *   ng-create-component-lookup => component-lookup-generate
 *   ng-metadata-query          => metadata-query
 */

/**
 * COMMAND IMPORTS
 */

// General TS AST Actions
import { action as dumpASTAction } from './lib/commands/dump-ast.command';
import { action as queryCommandAction } from './lib/commands/query.command';

// Targeted TS AST Actions
import { action as dumpClassesAction } from './lib/commands/dump-classes.command';
import { action as dumpEnumsAction } from './lib/commands/dump-enums.command';
import { action as dumpImportsAction } from './lib/commands/dump-imports.command';
import { action as dumpInterfacesAction } from './lib/commands/dump-interfaces.command';

// Ng TS AST Actions
import { action as dumpComponentClassDecoratorsAction } from './lib/commands/dump-component-class-decorators.command';
import { action as dumpDirectiveClassDecoratorsAction } from './lib/commands/dump-directive-class-decorators.command';
import { action as dumpNgModuleClassDecoratorsAction } from './lib/commands/dump-ng-module-class-decorators.command';

// Ng Metadata Action
import { action as ngMetadataCollectAction } from './lib/commands/ng-metadata-collect.command';
import { action as ngMetadataKeyAction } from './lib/commands/ng-metadata-key.command';
import { action as ngMetadataQueryAction } from './lib/commands/ng-metadata-query.command';
import { action as ngInlineResourcesAction } from './lib/commands/ng-inline-resources.command';
import { action as ngCreateComponentLookupAction } from './lib/commands/ng-create-component-lookup.command';
import { action as ngGenerateModuleAction } from './lib/commands/ng-generate-module.command';
import { action as ngGenerateComponentTemplates } from './lib/commands/ng-generate-component-templates.command';

// Ng Transform Actions
import { action as componentToElementTransformAction } from './lib/commands/component-to-element-transform.command';
import { action as wrapComponentinNamespaceTransformAction } from './lib/commands/wrap-component-in-namespace-transform.command';

// Ng Collection Pipeline Actions
import { action as collectionPipelineGenerate } from './lib/commands/collection-pipeline-generate.command';
import { action as collectionPipelineAdd } from './lib/commands/collection-pipeline-add.command';
import { action as collectionPipelineClone } from './lib/commands/collection-pipeline-clone.command';
import { action as collectionPipelinePrime } from './lib/commands/collection-pipeline-prime.command';
import { action as collectionPipelineTest } from './lib/commands/collection-pipeline-test.command';
import { action as collectionPipelineRun } from './lib/commands/collection-pipeline-run.command';

const packageJSON = fileUtil.loadJSONFile('package.json');
program.version(packageJSON.version);

program.command('dump-ast <dir>').action(dumpASTAction);
program.command('dump-imports <dir>').action(dumpImportsAction);
program.command('dump-classes <dir>').action(dumpClassesAction);
program.command('dump-enums <dir>').action(dumpEnumsAction);
program.command('dump-interfaces <dir>').action(dumpInterfacesAction);
program.command('dump-directives <dir>').action(dumpDirectiveClassDecoratorsAction);
program.command('dump-components <dir>').action(dumpComponentClassDecoratorsAction);
program.command('dump-ng-modules <dir>').action(dumpNgModuleClassDecoratorsAction);
program
  .command('query <selector> <dir>')
  .option('-a --ancestor <ancestor>', 'Backtrack to first ancestor of SyntaxKind')
  .action(queryCommandAction);

program.command('component-to-element-transform <dir>').action(componentToElementTransformAction);
program
  .command('wrap-component-in-namespace <namespace> <dir>')
  .description('Wraps Component class decorations in a namespace.')
  .action(wrapComponentinNamespaceTransformAction);

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
  .description(
    'Inline resources collects component templateUrl and styleUrls content and includes them in the @Component class decorator.'
  )
  .action(ngInlineResourcesAction);

program
  .command('ng-metadata-collect <dir>')
  .option('-o --output <output>', 'Output file name for metadata file')
  .option('-v --verbose', 'Verbosity level')
  .description(
    'Scans Angular project directory or file to pull out NgModules, Directives, Components, Injectables, classes, interfaces, and enums'
  )
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
  .option('-l --light', 'Generates light version of selector data')
  .description(
    'Generate lookup between Directive and Component selectors and their class definitions'
  )
  .action(ngCreateComponentLookupAction);

program
  .command('ng-generate-module <identifier> <filepath>')
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

program
  .command('ng-generate-component-templates <filepath>')
  .option('-d --outdir <outDir>', 'Output directory to write template files to.')
  .option('-m --mirror', 'Mirror directory structure used by components.')
  .description('Generate component template stubs')
  .action(ngGenerateComponentTemplates);

program
  .command('collection-pipeline-generate')
  .option('-o --output <output>', 'Output filepath to write collection pipeline config to.')
  .option('-d --outdir <outDir>', 'Output directory name to write metadata files to.')
  .option('-l --label <label>', 'Label for first pipeline in group')
  .description('Generate collection pipeline file used for curating contents of metadata file.')
  .action(collectionPipelineGenerate);

program
  .command('collection-pipeline-add <filepath> <label>')
  .description('Add a new pipeline with label to an existing collection file.')
  .action(collectionPipelineAdd);

program
  .command('collection-pipeline-clone <filepath> <src-label> <dest-label>')
  .description('Clone existing pipeline from source label to destination label.')
  .action(collectionPipelineClone);

program
  .command('collection-pipeline-prime <filepath> <label>')
  .description('Prime file list for collection pipeline.')
  .action(collectionPipelinePrime);

program
  .command('collection-pipeline-test <filepath> <label>')
  .description('Output file list from collection pipeline.')
  .action(collectionPipelineTest);

program
  .command('collection-pipeline-run <filepath>')
  .option('-l --label <label>', 'Label of pipeline to process')
  .description(
    'Collects Angular project metadata based on the pipelines defined in a collection group file.'
  )
  .action(collectionPipelineRun);

program.parse(process.argv);
