#!/usr/bin/env node

import program from 'commander';
import ts from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';
import JsonQuery from 'json-query';

import * as ct from './lib/component.transform';
import * as cdt from './lib/transforms/components/component-decorator.transform';
import * as compClassDecTrans from './lib/transforms/components/class-declaration.transform';
import * as fileUtil from './lib/utils/file.util';
import * as aleUtil from './lib/utils/array-literal-expression.util';
import * as oleUtil from './lib/utils/object-literal-expression.util';
import { Property as cdProperty } from './lib/declaration-metadata/component-decorator.property';

import * as dm from './lib/declaration-metadata/index.metadata';
import {
  IComponentDecoratorRef,
  IComponentInlineModel,
  IComponentInlineBuild,
  IComponentInlineTransformBundle,
} from './lib/transforms/components/inline-resources.interface';
import * as inlineResourceTransform from './lib/transforms/components/inline-resources.transform';

// TODO (ryan): Wrap-up chalk with console.log && console.error into a separate module
//   (and likely a singleton) to control output velocity levels across command runs.
//   Add verbosity level as an option to general command flags.
import logger from './lib/utils/logger.util';

// Still need chalk in some cases until Command module refactor.
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { getRootMetadataStub } from './lib/declaration-metadata/root.metadata';

/** COMMAND IMPORTS */
import { action as dumpClassesAction } from './lib/commands/dump-classes.command';
import { action as dumpEnumsAction } from './lib/commands/dump-enums.command';
import { action as dumpImportsAction } from './lib/commands/dump-imports.command';
import { action as dumpInterfacesAction } from './lib/commands/dump-interfaces.command';

import { action as dumpComponentClassDecoratorsAction } from './lib/commands/dump-component-class-decorators.command';
import { action as dumpDirectiveClassDecoratorsAction } from './lib/commands/dump-directive-class-decorators.command';
import { action as dumpNgModuleClassDecoratorsAction } from './lib/commands/dump-ng-module-class-decorators.command';

import { action as queryCommandAction } from './lib/commands/query.command';
import { action as ngCreateComponentLookupAction } from './lib/commands/ng-create-component-lookup.command';

import {
  getTypescriptFileASTsFromDirectory,
  dumpASTNode,
  findFilesWithASTMatchingSelector,
  generateTypescriptFromTransformationResults,
  generateTypescriptFromSourceFileAST,
} from './lib/utils/ast.util';
import {
  IFileAST,
  NgAstSelector,
  IFileTransformationResult,
  IFileASTQueryMatch,
} from './lib/interfaces/ast-file.interface';

const packageJSON = fileUtil.loadJSONFile('package.json');
program.version(packageJSON.version);

const printer: ts.Printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
});

interface IOutputNode {
  label?: string;
  collection: boolean;
  children: IOutputNode[];
  depth: number;
}

const generateOutputNodeStub = (): IOutputNode => {
  return {
    collection: false,
    children: [],
    depth: 0,
  };
};

const DEFAULT_KEY_INDENT: number = 2;
const TRIE_NODE_COUNT_PLACEHOLDER: string = 'COUNT_PLACEHOLDER';
interface TrieNodeProperties {
  count: number;
  children: TrieNode;
}
type TrieNode = Map<string, TrieNodeProperties>;

const generateTrieFromKeyData = (key: IOutputNode): TrieNode => {
  const trie: TrieNode = new Map<string, TrieNodeProperties>();

  /**
   * TODO (ryan): Have the start of this, but it needs to be refined
   *
   *   components[20]
   *     ngTemplate
   *     constructorDef
   *       injectedProperties[3]
   *        parameters[2]
   */
  const generateNodeName = (node: IOutputNode): string => {
    const label = node.label || '$root';
    const suffix: string | undefined = node.collection
      ? `${chalk.cyanBright.bold('[')}${TRIE_NODE_COUNT_PLACEHOLDER}${chalk.cyanBright.bold(']')}`
      : ` ${chalk.cyanBright('_')}${TRIE_NODE_COUNT_PLACEHOLDER}${chalk.cyanBright('_')}`;
    if (suffix) {
      return `${chalk.yellow(label)}${suffix}`;
    }

    return `${label}`;
  };

  const visitNode = (node: IOutputNode, parent: TrieNode) => {
    const name = generateNodeName(node);
    if (!parent.has(name)) {
      parent.set(name, {
        count: 0,
        children: new Map<string, TrieNodeProperties>(),
      });
    }
    const newSharedParent = parent.get(name);
    if (newSharedParent) {
      newSharedParent.count += 1;
      node.children.forEach((child: IOutputNode) => {
        visitNode(child, newSharedParent.children);
      });
    }
  };

  visitNode(key, trie);

  return trie;
};

const generateKeyPresentationFromTrie = (
  trie: TrieNode,
  maxDepth: number = Infinity,
  indent: number = DEFAULT_KEY_INDENT
): string => {
  const lines: string[] = [];
  const visit = (node: TrieNode, depth = 0) => {
    if (depth > maxDepth) return;

    Array.from(node.entries())
      .sort(([x], [y]) => {
        return x < y ? -1 : 1;
      })
      .forEach(([label, childTrie]) => {
        let updatedLabel = label;
        if (childTrie.count > 0) {
          updatedLabel = label.replace(TRIE_NODE_COUNT_PLACEHOLDER, `${childTrie.count}`);
        }
        lines.push(`${''.padStart(indent * depth, ' ')}${updatedLabel}`);
        visit(childTrie.children, depth + 1);
      });
  };

  visit(trie);
  return lines.join('\n');
};

const generateKeyFromData = (data: Object | Array<any>): IOutputNode => {
  const key = generateOutputNodeStub();
  const visit = (node: Object | Array<any>, keyRef: IOutputNode) => {
    if (Array.isArray(node)) {
      keyRef.collection = true;
      node.forEach((child: Object | Array<any>) => {
        visit(child, keyRef);
      });
    } else if (typeof node === 'object') {
      [...Object.entries(node)].forEach(([label, child]) => {
        const childKeyRef = generateOutputNodeStub();
        childKeyRef.label = label;
        childKeyRef.depth = keyRef.depth + 1;
        visit(child, childKeyRef);
        keyRef.children.push(childKeyRef);
      });
    }
  };

  visit(data, key);

  return key;
};

const generateKeyPresentationFromOutputNode = (
  key: IOutputNode,
  indent: number = DEFAULT_KEY_INDENT
): string => {
  const keyPresentation: string[] = [];
  const keyVisit = (node: IOutputNode) => {
    keyPresentation.push(
      `${''.padStart(indent * node.depth, ' ')}${node.label}${node.collection ? '[]' : ''}`
    );
    node.children.forEach((child: IOutputNode) => {
      keyVisit(child);
    });
  };
  keyVisit(key);

  return keyPresentation.join('\n');
};

// TODO (ryan): Clean this file up by moving each of the command functions into their
//   own files in lib/cli/command.
program.command('dump <dir>').action((dir: string, cmd: program.Command) => {
  const tsFiles = getTypescriptFileASTsFromDirectory(dir);
  tsFiles.forEach(({ filepath, ast }: IFileAST, index: number) => {
    logger.info(' - Processing file', filepath, '\n\n');
    dumpASTNode(ast, index);
  });
});

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

const generateComponentDecoratorRefs = (
  sourceFileMatches: IFileASTQueryMatch[]
): IComponentDecoratorRef[] => {
  return sourceFileMatches.reduce(
    (
      collection: IComponentDecoratorRef[],
      fileMatch: IFileASTQueryMatch
    ): IComponentDecoratorRef[] => {
      let sourceFile = fileMatch.ast;
      const refs: IComponentDecoratorRef[] = fileMatch.matches.map(
        (decorator: ts.Node): IComponentDecoratorRef => {
          const { filepath } = fileMatch;
          const dirname = path.dirname(filepath);
          return {
            filepath,
            dirname,
            sourceFile,
            decorator: decorator as ts.Decorator,
          };
        }
      );
      return [...collection, ...refs];
    },
    []
  );
};

const CSS_FILE_EXTENSION = 'css';
const SCSS_FILE_EXTENSION = 'scss';
const SCSS_REPLACE_REGEXP = /\.scss$/;

const generateComponentInlineModel = (
  { filepath, dirname, sourceFile, decorator }: IComponentDecoratorRef,
  srcDirectory: string | undefined
): IComponentInlineModel => {
  // File system and assets
  let relativeDirname = path.dirname(filepath);
  if (srcDirectory) {
    relativeDirname = path.relative(srcDirectory, relativeDirname);
  }

  // AST
  const callExpression = decorator.expression as ts.CallExpression;
  const objectLiteralExpression = callExpression.arguments[0] as ts.ObjectLiteralExpression;
  const oleProperties: ts.ObjectLiteralElementLike[] = objectLiteralExpression.properties.map(
    (node: ts.ObjectLiteralElementLike) => node
  );

  const template =
    oleUtil.getPropertyAsString(oleProperties, cdProperty.Template, true) || undefined;
  const templateUrl =
    oleUtil.getPropertyAsString(oleProperties, cdProperty.TemplateUrl, true) || undefined;
  const hasTemplateUrl: boolean = !!templateUrl;
  const stylesALE = oleUtil.getPropertyAsArrayLiteralExpression(oleProperties, cdProperty.Styles);
  const styles = stylesALE ? aleUtil.mapToArrayOfStrings(stylesALE) : undefined;
  const styleUrlsALE =
    oleUtil.getPropertyAsArrayLiteralExpression(oleProperties, cdProperty.StyleUrls) || undefined;
  const styleUrls = styleUrlsALE ? aleUtil.mapToArrayOfStrings(styleUrlsALE) : undefined;
  const styleUrlsMap = styleUrls
    ? styleUrls.reduce((urlMap: Map<string, string>, url: string): Map<string, string> => {
        let value = url;
        const extension = path.extname(value).split('.')[1];
        if (extension === SCSS_FILE_EXTENSION) {
          value = value.replace(SCSS_REPLACE_REGEXP, `.${CSS_FILE_EXTENSION}`);
        }
        urlMap.set(url, value);
        return urlMap;
      }, new Map<string, string>())
    : undefined;
  const hasStyleUrls: boolean = !!styleUrlsALE;

  return {
    // File system
    filepath,
    dirname,
    relativeDirname,

    // AST Nodes
    sourceFile,
    decorator,
    callExpression,
    objectLiteralExpression,

    // Assets
    template,
    hasTemplateUrl,
    templateUrl,

    styles,
    hasStyleUrls,
    styleUrls,
    styleUrlsMap,
  };
};

const loadAllComponentTemplateUrlContents = (
  models: IComponentInlineModel[],
  buildDirectory: string | undefined
): IComponentInlineModel[] => {
  return models
    .map(
      (model: IComponentInlineModel): IComponentInlineBuild => {
        const buildDirname: string | undefined = buildDirectory || undefined;
        return Object.assign({}, model, { buildDirname });
      }
    )
    .map(loadComponentTemplateUrlContents);
};

const attemptToGetFileContentsFromFilepaths = (filepaths: string[]): string | undefined => {
  const foundFilepath: string | undefined = filepaths.find((filepath: string) =>
    fs.existsSync(filepath)
  );
  if (foundFilepath) {
    logger.info('Reading file contents from: ', foundFilepath);
    return fs.readFileSync(foundFilepath, fileUtil.UTF8);
  }

  logger.error('Cannot find file contents at filepaths', filepaths.join(', '));
  return undefined;
};

const loadComponentTemplateUrlContents = (build: IComponentInlineBuild): IComponentInlineModel => {
  // NOTE (ryan): Should we throw an error if the component has both a template as well as
  //   a templateUrl? What does Angular do when both are present?
  if (build.hasTemplateUrl && build.templateUrl) {
    const possibleFilepaths: string[] = [];
    if (build.buildDirname) {
      const buildFilepath = path.resolve(
        path.join(build.buildDirname, build.relativeDirname, build.templateUrl)
      );
      possibleFilepaths.push(buildFilepath);
    }
    const srcFilepath = path.resolve(path.join(build.dirname, build.templateUrl));
    possibleFilepaths.push(srcFilepath);

    const contents: string | undefined = attemptToGetFileContentsFromFilepaths(possibleFilepaths);
    if (contents) {
      build.template = contents;
    }
  }

  return build;
};

const loadAllComponentStyleUrlsContent = (
  models: IComponentInlineModel[],
  buildDirectory: string | undefined
): IComponentInlineModel[] => {
  return models
    .map(
      (model: IComponentInlineModel): IComponentInlineBuild => {
        const buildDirname: string | undefined = buildDirectory || undefined;
        return Object.assign({}, model, { buildDirname });
      }
    )
    .map(loadComponentStyleUrlsContent);
};

const loadComponentStyleUrlsContent = (build: IComponentInlineBuild): IComponentInlineModel => {
  // NOTE (ryan): Should we throw an error if the component has both a styles Array as well as
  //   a styleUrls Array? What does Angular do when both are present?
  if (build.hasStyleUrls && build.styleUrls && build.styleUrlsMap) {
    const styleUrlContents: string[] = [];
    build.styleUrls.forEach((url: string) => {
      let styleUrl = url;
      if (build.styleUrlsMap instanceof Map && build.styleUrlsMap.has(url)) {
        styleUrl = build.styleUrlsMap.get(url) || url;
      }

      const possibleFilepaths: string[] = [];
      if (build.buildDirname) {
        const buildFilepath = path.resolve(
          path.join(build.buildDirname, build.relativeDirname, styleUrl)
        );
        possibleFilepaths.push(buildFilepath);
      }
      const srcFilepath = path.resolve(path.join(build.dirname, styleUrl));
      possibleFilepaths.push(srcFilepath);

      const contents: string | undefined = attemptToGetFileContentsFromFilepaths(possibleFilepaths);
      if (contents) {
        styleUrlContents.push(contents);
      }
    });

    build.styles = styleUrlContents;
  }

  return build;
};

const resolveDirectoryPathFragment = (fragment: string | undefined): string | undefined => {
  return fragment ? path.resolve(fragment) : undefined;
};

const ascendToSourceFileFromNode = (child: ts.Node): ts.SourceFile | undefined => {
  // Ascend to source file
  let sourceFileNode: ts.Node = child;
  while (!ts.isSourceFile(sourceFileNode) && sourceFileNode.parent) {
    sourceFileNode = sourceFileNode.parent;
  }

  if (ts.isSourceFile(sourceFileNode)) {
    return sourceFileNode as ts.SourceFile;
  } else {
    logger.error('Node is not a descendant of SourceFile', child.getText());
  }

  return;
};

const logModelStateToConsole = (models: IComponentInlineModel[]) => {
  console.log(
    JSON.stringify(
      models.map(model =>
        Object.assign({}, model, {
          // NOTE (ryan): Another way to do this would be to filter out
          //   entries that were instancesof ts.Node
          decorator: undefined,
          sourceFile: model.sourceFile.fileName,
          callExpression: undefined,
          objectLiteralExpression: undefined,
          styleUrlsMap: model.styleUrlsMap ? Array.from(model.styleUrlsMap.entries()) : undefined,
        })
      ),
      null,
      2
    )
  );
};

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
  .action((dir: string, cmd: program.Command) => {
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
      logger.error(
        '--css-build flag and --template-build flag must be used together',
        '\n\tExiting'
      );
      return 0;
    }

    const tsFiles = getTypescriptFileASTsFromDirectory(dir);
    const sourceFileMatches = findFilesWithASTMatchingSelector(
      tsFiles,
      NgAstSelector.ComponentDecoratorOnClassDeclaration
    ).filter((fileMatch: IFileASTQueryMatch) => {
      const result = tsquery(
        fileMatch.ast,
        NgAstSelector.ImportDeclarationWithTestInModuleSpecifier
      );
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
        const result: ts.TransformationResult<ts.SourceFile> = inlineResourceTransform.invoke(
          bundle
        );
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
  });

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

// TODO (ryan): Move these to lib.
interface IObject {
  [key: string]: any;
}

const jsonQueryLocals = {
  // TODO (ryan): This needs to be further refined.
  // Usage:
  //   directives:count()
  //   components:count()
  count: function(input: Array<any> | undefined) {
    if (Array.isArray(input)) {
      return { count: input.length };
    }
  },

  // Usage:
  //   directives:select(filepath,identifier,selector)
  //   components:select(filepath,identifier,selector,ngTemplate)
  select: function(input: Array<any> | undefined) {
    if (Array.isArray(input)) {
      var keys: string[] = [].slice.call(arguments, 1);
      return input.map((item: IObject) => {
        return Object.keys(item).reduce((result: IObject, key: string) => {
          if (keys.includes(key)) {
            result[key] = item[key];
          }
          return result;
        }, {});
      });
    }
  },
};

// TODOs (ryan):
//   1. Move the key and query functions out into ./lib/
//   2. Clean-up JSON Query Select Function into ./lib/
program
  .command('ng-metadata-collect <dir>')
  .option('-o --output <output>', 'Output file name for metadata file')
  .option('-v --verbose', 'Verbosity level')
  .description('Scans typescript files in a directory to pull out classes, interfaces, and enums')
  .action((dir: string, cmd: program.Command) => {
    logger.info(`Scanning ${dir}`);

    const outputFile = cmd.opts()['output'] || null;
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

    if (outputFile) {
      logger.info('Saving metadata file to', outputFile);
      fs.writeFileSync(outputFile, JSON.stringify(interfaces, null, 2));
    } else {
      console.log(JSON.stringify(interfaces, null, 2));
    }
  });

program
  .command('ng-metadata-key <filepath>')
  .option('-o --output <output>', 'Output file name for metadata query results file')
  .option('-d --depth <depth>', 'Limit key output to specified depth')
  .option('-i --indent <indent>', 'Indentation level')
  .description(
    'Generates an abbreviated interface key to facility the use of json-query syntax in ng-metadata-query command.'
  )
  .action((filepath: string, cmd: program.Command) => {
    const outputFile = cmd.opts()['output'] || null;
    const maxDepth: number = cmd.opts()['depth'] ? parseInt(cmd.opts()['depth'], 10) : Infinity;
    const indentLevel: number = cmd.opts()['indent']
      ? parseInt(cmd.opts()['indent'], 10)
      : DEFAULT_KEY_INDENT;

    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath, fileUtil.UTF8);
      const metadata = JSON.parse(raw);
      logger.success('Output key');
      const key = generateKeyFromData(metadata);
      // console.log(JSON.stringify(key, null, 2));

      // const keyPresentation = generateKeyPresentationFromOutputNode(key);
      // console.log(chalk.bgGreen.black('Output key presentation'));
      // console.log(keyPresentation);

      const trie = generateTrieFromKeyData(key);
      const triePresentation = generateKeyPresentationFromTrie(trie, maxDepth, indentLevel);

      if (outputFile) {
        fs.writeFileSync(outputFile, triePresentation);
        logger.success('Saving metadata file key to', outputFile);
      } else {
        console.log(triePresentation, null, 2);
      }
    } else {
      logger.error('Metadata file does not exist', filepath);
    }
  });

program
  .command('ng-metadata-query <query> <filepath>')
  .option('-o --output <output>', 'Output file name for metadata file')
  .description('Queries the file output of ng-metadata-collect using json-query syntax')
  .action((query: string, filepath: string, cmd: program.Command) => {
    const outputFile = cmd.opts()['output'] || null;

    if (fs.existsSync(filepath)) {
      const raw = fs.readFileSync(filepath, fileUtil.UTF8);
      let metadata: Object = JSON.parse(raw);

      if (query) {
        metadata = JsonQuery(query, {
          data: metadata,
          locals: jsonQueryLocals,
        }).value;
      }

      if (outputFile) {
        fs.writeFileSync(outputFile, JSON.stringify(metadata, null, 2));
        logger.success('Saving metadata query results to', outputFile);
      } else {
        console.log(
          chalk.green.bold('Metadata'),
          (query && chalk.bold.yellow(`with query of ${query}`)) || ''
        );

        console.log(JSON.stringify(metadata, null, 2));
      }
    } else {
      logger.error('Metadata file does not exist', filepath);
    }
  });

program
  .command('ng-create-component-lookup <filepath>')
  .option('-r --relative <relative>', 'Relative filepath to prune to for source files')
  .description('Generate ')
  .action(ngCreateComponentLookupAction);

program.parse(process.argv);
