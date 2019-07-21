#!/usr/bin/env node

import program from 'commander';
import ts from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';
import JsonQuery from 'json-query';

import * as ct from './lib/component.transform';
import * as cdt from './lib/transforms/components/component-decorator.transform';
import * as compClassDecTrans from './lib/transforms/components/class-declaration.transform';
import * as fileUtil from './lib/utils/file.util';
import * as prettierUtil from './lib/utils/prettier.util';
import * as aleUtil from './lib/utils/array-literal-expression.util';
import * as oleUtil from './lib/utils/object-literal-expression.util';
import { Property as cdProperty } from './lib/declaration-metadata/component-decorator.properties';

import * as dm from './lib/declaration-metadata/index.metadata';

// TODO (ryan): Wrap-up chalk with console.log && console.error into a separate module
//   (and likely a singleton) to control output velocity levels across command runs.
//   Add verbosity level as an option to general command flags.
import * as logger from './lib/utils/logger.util';

// Still need chalk in some cases until Command module refactor.
import chalk from 'chalk';
import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { getRootMetadataStub } from './lib/declaration-metadata/root.metadata';

const packageJSON = fileUtil.loadJSONFile('package.json');

const TS_NODE_BASE_ATTRS = new Set([
  // from TextRange interface
  'pos',
  'end',
  // from Node interface
  'kind',
  'flags',
  'modifierFlagsCache',
  'parent',
  'transformFlags',
]);

const TS_FILE_EXTNAME = '.ts';

const printer: ts.Printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
});

enum NgAstSelector {
  ComponentDecoratorContainingTemplateUrl = "ClassDeclaration Decorator:has(Identifier[name='Component']) PropertyAssignment:has(Identifier[name='templateUrl']) StringLiteral",
  ComponentDecoratorContainingStyleUrls = "ClassDeclaration Decorator:has(Identifier[name='Component']) PropertyAssignment:has(Identifier[name='styleUrls']) StringLiteral",
  // For the following, would still need to backtrack to ImportDeclaration
  NgImportComponentDecoratorFromCore = "ImportDeclaration:has(ImportClause:has(NamedImports ImportSpecifier Identifier[name='Component'])) StringLiteral[value=/@angular/][value=/core/]",
  NgInterfaces = 'ClassDeclaration, InterfaceDeclaration, EnumDeclaration, SourceFile > FunctionDeclaration, SourceFile > ArrowFunction, SourceFile > TypeAliasDeclaration',
  ComponentDecoratorOnClassDeclaration = "ClassDeclaration Decorator:has(Identifier[name='Component'])",
  ImportDeclarationWithTestInModuleSpecifier = 'ImportDeclaration[moduleSpecifier.text=/test/]',
  ComponentTemplateUrlTSQuery = "ClassDeclaration Decorator:has(CallExpression[expression.escapedText='Component']) PropertyAssignment[name.escapedText='templateUrl']",
  ComponentStyleUrlsTSQuery = "ClassDeclaration Decorator:has(CallExpression[expression.escapedText='Component']) PropertyAssignment[name.escapedText='styleUrls']",
}

interface IFileAST {
  filepath: string;
  source: string;
  ast: ts.Node;
  srcDirectory?: string;
  buildDirectory?: string;
  relativeDirname?: string;
}

interface IFileASTQueryMatch extends IFileAST {
  matches: ts.Node[];
}

interface IFileTransformationResult extends IFileAST {
  transformation: ts.TransformationResult<ts.SourceFile>;
}

const dumpASTNode = (node: ts.Node, index: number = 0, depth: number = 0, indent: number = 4) => {
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

const getTypescriptFileASTsFromDirectory = (dir: string): IFileAST[] => {
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

  return tsFiles.map((filepath: string) => {
    const source = fs.readFileSync(filepath, fileUtil.UTF8);
    const ast = tsquery.ast(source);
    return {
      filepath,
      source,
      ast,
    };
  });
};

const findFilesWithASTMatchingSelector = (
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

const generateTypescriptFromTransformationResults = (
  results: IFileTransformationResult[],
  pretty: boolean = false
): string[] => {
  return results.map(({ filepath, transformation }: IFileTransformationResult) => {
    const updatedComponentSFAST = transformation.transformed[0];
    const updatedFilepath = `${path.basename(filepath)}.element.ts`;
    return generateTypescriptFromSourceFileAST(updatedComponentSFAST, updatedFilepath, pretty);
  });
};

const generateTypescriptFromSourceFileAST = (
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

type TrieNode = Map<string, Map<string, any>>;

const generateTrieFromKeyData = (key: IOutputNode): TrieNode => {
  const trie: TrieNode = new Map<string, TrieNode>();

  const generateNodeName = (node: IOutputNode): string =>
    `${node.label}${node.collection ? '[]' : ''}`;

  const visitNode = (node: IOutputNode, parent: TrieNode) => {
    const name = generateNodeName(node);
    if (!parent.has(name)) {
      parent.set(name, new Map<string, TrieNode>());
    }
    const newSharedParent = parent.get(name);
    if (newSharedParent) {
      node.children.forEach((child: IOutputNode) => {
        visitNode(child, newSharedParent);
      });
    }
  };

  visitNode(key, trie);

  return trie;
};

const generateKeyFromTrie = (trie: TrieNode): string => {
  const lines: string[] = [];
  const visit = (node: TrieNode, depth = 0) => {
    Array.from(node.entries())
      .sort(([x], [y]) => {
        return x < y ? -1 : 1;
      })
      .forEach(([label, childTrie]) => {
        lines.push(`${''.padStart(2 * depth, ' ')}${label || '$root'}`);
        visit(childTrie, depth + 1);
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

const generateKeyPresentationFromOutputNode = (key: IOutputNode): string => {
  const keyPresentation: string[] = [];
  const keyVisit = (node: IOutputNode) => {
    keyPresentation.push(
      `${''.padStart(2 * node.depth, ' ')}${node.label}${node.collection ? '[]' : ''}`
    );
    node.children.forEach((child: IOutputNode) => {
      keyVisit(child);
    });
  };
  keyVisit(key);

  return keyPresentation.join('\n');
};

program.version(packageJSON.version);

// TODO (ryan): Clean this file up by moving each of the command functions into their
//   own files in lib/cli/command.
program.command('dump <dir>').action((dir: string, cmd: program.Command) => {
  const tsFiles = getTypescriptFileASTsFromDirectory(dir);
  tsFiles.forEach(({ filepath, ast }: IFileAST, index: number) => {
    logger.info(' - Processing file', filepath, '\n\n');
    dumpASTNode(ast, index);
  });
});

// TODO (ryan): Improve usability/scannability by parsing node types from selector
//   and then using them to highlight matching nodes in output.
program
  .command('query <selector> <dir>')
  .option('-a --ancestor <ancestor>', 'Backtrack to first ancestor of SyntaxKind')
  .action((selector: string, dir: string, cmd: program.Command) => {
    const tsFiles = getTypescriptFileASTsFromDirectory(dir);
    const tsFilesWithNodesMatchingSelector = findFilesWithASTMatchingSelector(tsFiles, selector);
    const ancestor = cmd.opts()['ancestor'] || null;
    tsFilesWithNodesMatchingSelector.forEach(({ filepath, matches }, fileIndex) => {
      logger.newline(2);
      logger.info(`Processing file`, filepath);
      matches.forEach((node: ts.Node, index) => {
        while (ancestor && node.parent && ts.SyntaxKind[node.kind] != ancestor) {
          node = node.parent;
        }
        dumpASTNode(node, index);
      });
    });
  });

program.command('dump-imports <dir>').action((dir: string, cmd: program.Command) => {
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
});

program.command('dump-classes <dir>').action((dir: string, cmd: program.Command) => {
  const scanDirPath = path.join(process.cwd(), dir);
  logger.info(`Scanning components in`, scanDirPath);

  if (!fs.existsSync(scanDirPath)) {
    logger.error(`Directory does note exist`, scanDirPath);
  }

  const tsFiles = glob.sync(`${scanDirPath}/**/*.ts`);
  tsFiles.forEach((filepath: string) => {
    const source = fs.readFileSync(filepath, fileUtil.UTF8);
    const ast = tsquery.ast(source);
    const nodes = tsquery(ast, `ClassDeclaration`);
    nodes.forEach((node, index) => {
      logger.newline(2);
      logger.info(' - Processing file', filepath, '\n');
      dumpASTNode(node, index);
    });
  });
});

program.command('dump-directives <dir>').action((dir: string, cmd: program.Command) => {
  logger.info(`Scanning directives in ${dir}`);
});

program
  .command('dump-component-class-decorators <dir>')
  .action((dir: string, cmd: program.Command) => {
    const scanDirPath = path.join(process.cwd(), dir);
    logger.info(`Scanning component class decorators in ${dir}`);

    if (!fs.existsSync(scanDirPath)) {
      logger.error(`Directory does note exist`, scanDirPath);
    }

    const tsFiles = glob.sync(`${scanDirPath}/**/*.ts`);
    tsFiles.forEach((filepath: string) => {
      const source = fs.readFileSync(filepath, fileUtil.UTF8);
      const ast = tsquery.ast(source);
      const nodes = tsquery(ast, `ClassDeclaration Decorator[name.name="Component"]`);
      nodes.forEach((node, index) => {
        logger.newline(2);
        logger.info(' - Processing file', filepath, '\n');
        dumpASTNode(node, index);
      });
    });
  });

program
  .command('dump-component-attribute-decorators <dir>')
  .action((dir: string, cmd: program.Command) => {
    logger.info(`Scanning component attribute decorators in ${dir}`);
  });

program.command('dump-interfaces <dir>').action((dir: string, cmd: program.Command) => {
  logger.info(`Scanning interfaces in ${dir}`);
});

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

interface IComponentDecoratorRef {
  // File system
  filepath: string;
  dirname: string;
  // AST Nodes
  decorator: ts.Decorator;
}

const generateComponentDecoratorRefs = (
  sourceFileMatches: IFileASTQueryMatch[]
): IComponentDecoratorRef[] => {
  return sourceFileMatches.reduce(
    (
      collection: IComponentDecoratorRef[],
      fileMatch: IFileASTQueryMatch
    ): IComponentDecoratorRef[] => {
      const refs: IComponentDecoratorRef[] = fileMatch.matches.map(
        (decorator: ts.Node): IComponentDecoratorRef => {
          const { filepath } = fileMatch;
          const dirname = path.dirname(filepath);
          return {
            filepath,
            dirname,
            decorator: decorator as ts.Decorator,
          };
        }
      );
      return [...collection, ...refs];
    },
    []
  );
};

interface IComponentInlineModel extends IComponentDecoratorRef {
  // File system
  relativeDirname: string;

  // AST Nodes
  callExpression: ts.CallExpression;
  objectLiteralExpression: ts.ObjectLiteralExpression;

  // Assets
  template?: string;
  hasTemplateUrl: boolean; // Present to determine if we need to prune this property after transform.
  templateUrl?: string;
  styles?: string[];
  hasStyleUrls: boolean; // Present to determine if we need to prune this property after transform.
  styleUrls?: string[]; // Need this to preserve order as well as the needing the map!
  styleUrlsMap?: Map<string, string>;
}

interface IComponentInlineBuild extends IComponentInlineModel {
  buildDirname?: string;
}

const CSS_FILE_EXTENSION = 'css';
const SCSS_FILE_EXTENSION = 'scss';
const SCSS_REPLACE_REGEXP = /\.scss$/;

const generateComponentInlineModel = (
  { filepath, dirname, decorator }: IComponentDecoratorRef,
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

const inlineComponentAssetContentsFromModelTransform = (model: IComponentInlineModel) => {
  const updatedOLEProperties: ts.ObjectLiteralElementLike[] = [];
  model.objectLiteralExpression.properties.forEach((element: ts.ObjectLiteralElementLike) => {
    if (element.name) {
      const propertyName = element.name.getText();
      switch (propertyName) {
        case cdProperty.Template:
          // Template already existed in decorator, so just add it to the new OLE.
          if (!model.hasTemplateUrl) {
            updatedOLEProperties.push(element);
          }
          break;
        case cdProperty.Styles:
          // Styles already existed in decorator, so just add them to the new OLE.
          if (!model.hasStyleUrls) {
            updatedOLEProperties.push(element);
          }
          break;
        case cdProperty.TemplateUrl:
          if (model.hasTemplateUrl && model.template) {
            const templateProperty = ts.createPropertyAssignment(
              ts.createStringLiteral(cdProperty.Template),
              ts.createNoSubstitutionTemplateLiteral(model.template)
            );
            updatedOLEProperties.push(templateProperty);
          } else {
            updatedOLEProperties.push(element);
          }
          break;
        case cdProperty.StyleUrls:
          if (model.hasStyleUrls && model.styles) {
            const styleItems = model.styles.map(
              (style: string): ts.NoSubstitutionTemplateLiteral => {
                return ts.createNoSubstitutionTemplateLiteral(style);
              }
            );
            const stylesProperty = ts.createPropertyAssignment(
              ts.createIdentifier(cdProperty.Styles),
              ts.createArrayLiteral(styleItems, false)
            );
            updatedOLEProperties.push(stylesProperty);
          }
          break;
        default:
          updatedOLEProperties.push(element);
          break;
      }
    }
  });

  const updatedOLE: ts.ObjectLiteralExpression = ts.createObjectLiteral(updatedOLEProperties);
  model.callExpression.expression = updatedOLE;
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
  .option('-p --pretty', 'Output files through Prettier')
  .action((dir: string, cmd: program.Command) => {
    /**
     * sourceDirectoryRoot and buildDirectoryRoot should be used together
     *   to read out compiled assets from the build directory (templatesUrls
     *   and processes .scss styles) based on where they were located in the
     *   src directory!
     */

    const rewriteSourceFiles: boolean = cmd.opts()['output'] || false;
    const pretty: boolean = cmd.opts()['pretty'] || false;
    const srcDirname = resolveDirectoryPathFragment(cmd.opts()['src']);
    const buildDirname = resolveDirectoryPathFragment(cmd.opts()['build']);
    logger.info('Directories in args', srcDirname || '[unknown]', buildDirname || '[unknown]');

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

    logger.info('BEFORE loading asset URLs');
    logModelStateToConsole(models);

    // Update models with the contents of templateUrl and styleUrls
    models = loadAllComponentTemplateUrlContents(models, buildDirname);
    models = loadAllComponentStyleUrlsContent(models, buildDirname);

    logger.info('AFTER loading asset URLs');
    logModelStateToConsole(models);

    const updatedSourceFiles: ts.SourceFile[] = models
      .map(
        (model: IComponentInlineModel): ts.SourceFile | undefined => {
          inlineComponentAssetContentsFromModelTransform(model);
          return ascendToSourceFileFromNode(model.decorator);
        }
      )
      .filter(
        (node: ts.SourceFile | undefined) => node && ts.isSourceFile(node)
      ) as ts.SourceFile[];

    const uniqueSourceFiles: ts.SourceFile[] = Array.from(
      new Set<ts.SourceFile>(updatedSourceFiles)
    ) as ts.SourceFile[];

    uniqueSourceFiles.forEach((file: ts.SourceFile) => {
      const result: string = generateTypescriptFromSourceFileAST(file, file.fileName, pretty);
      logger.info('Transform results');
      console.log(result);
    });

    /**
     * TODO (ryan): Need to significantly rethink this. The AST node in each of these
     *   QueryMatches is at the SourceFile root rather than at the level of the
     *   ClassDeclaration with a Component decorator.
     *
     *   We should be building up a collection of those ClassDeclaration nodes and
     *   running our transform over those nodes directly. So order of operations
     *   should be:
     *
     *     DONE 1. Iterate through each SourceFile query match
     *     DONE 2. Query for all of the ClassDeclarations with Component Decorators
     *     DONE 2.5 Filter out all of the test files.
     *     DONE 3. Build up results of step #2 into a single collection
     *     DONE 4. Iterate through component decorator collection to collect templateUrls
     *     DONE 5. Iterate through component decorator collection to collect styleUrls
     *     DONE 6. Load contents of templateUrl and styleUrls
     *     DONE 7. Pass templateUrl and styleUrl filenames and contents to transform
     *     DONE 8. Inline template and styles contents in transform
     *     DONE 8.5 For each model, ascend ancestry to SourceFile ts.node
     *     DONE 8.6 Generate unique collection of SourceFile nodes (since there can be many components in a SourceFile)
     *     DONE 9. Output nice clean TypeScript from SourceFile nodes
     *     DONE 9.5 Refactor generateTypescriptFromTransformationResult per TODOs above
     *     DONE 9.6 Refactor commands using generateTypescriptFromTransformationResult to conform
     *         to new interface
     *     10. Save updated files to disk
     *     DONE 11. Implement prettier flag (to control degree to which output TS is modified)
     * */

    // TODO (ryan): Finish this!
    //   1. Wrap template contents in NoSubstitutionTemplateLiteral
    //   2. Write styles content into NoSubstitutionTemplateLiterals

    // let components = componentDecoratorImportMatches;
    // if (sourceDirectoryRoot && buildDirectoryRoot) {
    //   components = componentDecoratorImportMatches.map((queryMatch: IFileASTQueryMatch) => {
    //     // TODO (ryan): Resolve these correctly
    //     const srcDirectory = path.resolve(sourceDirectoryRoot);
    //     const buildDirectory = path.resolve(buildDirectoryRoot);
    //     const relativeDirname = path.dirname(path.relative(srcDirectory, queryMatch.filepath));
    //     const componentDecorator = tsquery(queryMatch.ast, 'ClassDeclaration Decorators[]');

    //     return {
    //       ...queryMatch,
    //       srcDirectory,
    //       buildDirectory,
    //       relativeDirname,
    //     };
    //   });
    // }

    // console.log(
    //   'Query Matches with directories',
    //   JSON.stringify(
    //     components.map(component => {
    //       return {
    //         ...component,
    //         // Prune the AST to drop circular structure.
    //         ast: null,
    //         matches: [],
    //         src: '',
    //       };
    //     }),
    //     null,
    //     2
    //   )
    // );

    // const transformationResults = components.map(
    //   ({ filepath, source, ast }): IFileTransformationResult => {
    //     const transformation = ts.transform(ast, [
    //       ct.inlineHTMLTemplateFromFileInComponentDecoratorTransformer(filepath),
    //       cdt.inlineCSSFromFileTransformer(filepath),
    //     ]) as ts.TransformationResult<ts.SourceFile>;

    //     return {
    //       filepath,
    //       source,
    //       ast,
    //       transformation,
    //     };
    //   }
    // );

    // if (rewriteSourceFiles) {
    //   console.log(chalk.green.bold('Rewriting source files'));
    //   generateTypescriptFromTransformationResult(transformationResults);
    // } else {
    //   console.log(chalk.green.bold('Outputting source files to stdout'));
    //   generateTypescriptFromTransformationResult(transformationResults);
    // }
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
  // Usage:
  //   directives:select(filepath,identifier,selector)
  //   components:select(filepath,identifier,selector,bootstrappingTemplate)

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
  .description(
    'Generates an abbreviated interface key to facility the use of json-query syntax in ng-metadata-query command.'
  )
  .action((filepath: string, cmd: program.Command) => {
    const outputFile = cmd.opts()['output'] || null;

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
      const triePresentation = generateKeyFromTrie(trie);

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

program.parse(process.argv);
