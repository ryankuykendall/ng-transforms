import program from 'commander';
import ts from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';
import logger from '../utils/logger.util';
import fs from 'fs';
import { resolveDirectoryPathFragment } from '../utils/file.util';
import {
  getTypescriptFileASTsFromDirectory,
  findFilesWithASTMatchingSelector,
  generateTypescriptFromSourceFileAST,
} from './../utils/ast.util';
import { NgAstSelector, IFileASTQueryMatch } from './../interfaces/ast-file.interface';
import {
  IComponentDecoratorRef,
  IComponentInlineModel,
  IComponentInlineTransformBundle,
} from './../transforms/components/inline-resources.interface';
import {
  generateComponentDecoratorRefs,
  generateComponentInlineModel,
  loadAllComponentTemplateUrlContents,
  loadAllComponentStyleUrlsContent,
} from './ng-inline-resources.util';
import * as inlineResourceTransform from './../transforms/components/inline-resources.transform';

export const action = (dir: string, cmd: program.Command) => {
  /**
   * sourceDirectoryRoot and buildDirectoryRoot should be used together
   *   to read out compiled assets from the build directory (templatesUrls
   *   and processes .scss styles) based on where they were located in the
   *   src directory!
   */

  const rewriteSourceFiles: boolean = cmd.opts()['rewrite'] || false;
  const pretty: boolean = cmd.opts()['pretty'] || false;
  const srcDirname = resolveDirectoryPathFragment(cmd.opts()['src']);
  const buildDirname = resolveDirectoryPathFragment(cmd.opts()['build']);
  const cssBuildDirname = resolveDirectoryPathFragment(cmd.opts()['cssBuild']);
  const templateBuildDirname = resolveDirectoryPathFragment(cmd.opts()['templateBuild']);

  // TODO (ryan): When moving commands to separate modules during cleanup/refactor, develop
  //   a reusable flags validation pattern to address the following combinations.
  if (!buildDirname && !cssBuildDirname && !templateBuildDirname) {
    logger.error(
      'Build directory flags are required',
      '\n\tPlease provide either the --build flag or the --css-build and --template-build flag combination.',
      '\n\tExiting'
    );
    return 0;
  }

  if ((buildDirname && cssBuildDirname) || (buildDirname && templateBuildDirname)) {
    logger.error(
      '--build flag cannot be used with --css-build or --template-build flags',
      '\n\tExiting'
    );
    return 0;
  }

  if ((cssBuildDirname && !templateBuildDirname) || (!cssBuildDirname && templateBuildDirname)) {
    logger.error('--css-build flag and --template-build flag must be used together', '\n\tExiting');
    return 0;
  }

  const tsFiles = getTypescriptFileASTsFromDirectory(dir);
  const sourceFileMatches = findFilesWithASTMatchingSelector(
    tsFiles,
    NgAstSelector.ComponentDecoratorOnClassDeclaration
  ).filter((fileMatch: IFileASTQueryMatch) => {
    const result = tsquery(fileMatch.ast, NgAstSelector.ImportDeclarationWithTestInModuleSpecifier);
    return result.length === 0;
  });

  const refs = generateComponentDecoratorRefs(sourceFileMatches);
  let models: IComponentInlineModel[] = refs.map(
    (ref: IComponentDecoratorRef): IComponentInlineModel => {
      return generateComponentInlineModel(ref, srcDirname);
    }
  );

  // logger.info('BEFORE loading asset URLs');
  // logModelStateToConsole(models);

  // Update models with the contents of templateUrl and styleUrls
  if (buildDirname) {
    models = loadAllComponentTemplateUrlContents(models, buildDirname);
    models = loadAllComponentStyleUrlsContent(models, buildDirname);
  } else {
    models = loadAllComponentTemplateUrlContents(models, templateBuildDirname);
    models = loadAllComponentStyleUrlsContent(models, cssBuildDirname);
  }

  // logger.info('AFTER loading asset URLs');
  // logModelStateToConsole(models);

  const transformBundlesMap: Map<ts.SourceFile, IComponentInlineModel[]> = models.reduce(
    (distribution: Map<ts.SourceFile, IComponentInlineModel[]>, model: IComponentInlineModel) => {
      const { sourceFile } = model;
      if (!distribution.has(sourceFile)) {
        distribution.set(sourceFile, []);
      }

      const modelCollection = distribution.get(sourceFile);
      if (modelCollection) {
        modelCollection.push(model);
      }
      return distribution;
    },
    new Map<ts.SourceFile, IComponentInlineModel[]>()
  );

  const transformBundles: IComponentInlineTransformBundle[] = Array.from(
    transformBundlesMap.entries()
  ).map(
    ([sourceFile, models]): IComponentInlineTransformBundle => {
      return {
        sourceFile,
        models,
      };
    }
  );

  // TODO (ryan): Filter out bundles (and models) for which all models show inlined template
  //   and styles. We should not be transforming components that do not require rewriting.

  const transformBundlesComplete: IComponentInlineTransformBundle[] = transformBundles.map(
    (bundle: IComponentInlineTransformBundle) => {
      const [firstModel] = bundle.models;
      const result: ts.TransformationResult<ts.SourceFile> = inlineResourceTransform.invoke(bundle);
      bundle.transformOutput = generateTypescriptFromSourceFileAST(
        result.transformed[0],
        firstModel.filepath,
        pretty
      );
      logger.success(`Transform results for`, bundle.models[0].filepath);
      console.log(bundle.transformOutput);
      return bundle;
    }
  );

  if (rewriteSourceFiles) {
    transformBundlesComplete.forEach((bundle: IComponentInlineTransformBundle) => {
      const [firstModel] = bundle.models;
      const { filepath } = firstModel;
      logger.success('Overwriting file with transform result', filepath);
      fs.writeFileSync(filepath, bundle.transformOutput);
    });
  }
};
