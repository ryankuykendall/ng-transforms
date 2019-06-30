#!/usr/bin/env node

import program from 'commander';
import ts from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';

import * as ct from './lib/component.transform';
import * as cdt from './lib/transforms/components/component-decorator.transform';
import * as compClassDecTrans from './lib/transforms/components/class-declaration.transform';
import * as fileUtil from './lib/utils/file.util';
import * as prettierUtil from './lib/utils/prettier.util';

import * as dm from './lib/declaration-metadata/index.metadata';
import * as dmIfIf from './lib/declaration-metadata/interface.interface';

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
}

interface IFileAST {
  filepath: string;
  source: string;
  ast: ts.Node;
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
    console.log(chalk.red.bold(`Directory or file does not exist`), scanDirPath);
  }

  let tsFiles: string[] = [scanDirPath];
  if (path.extname(scanDirPath) !== TS_FILE_EXTNAME) {
    tsFiles = glob.sync(`${scanDirPath}/**/*.ts`);
    console.log(chalk.yellow.bold(`Processing files in`), scanDirPath);
  } else {
    console.log(chalk.yellow.bold('Processing file'), scanDirPath);
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

const generateTypescriptFromTransformationResult = (results: IFileTransformationResult[]): void => {
  results.forEach(({ filepath, transformation }: IFileTransformationResult) => {
    const updatedComponentSFAST = transformation.transformed[0];
    const updatedFilepath = `${path.basename(filepath)}.element.ts`;
    const updatedSourceFile: ts.SourceFile = ts.createSourceFile(
      updatedFilepath,
      '',
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );
    const updatedComponentSource = ts
      .createPrinter()
      .printNode(ts.EmitHint.SourceFile, updatedComponentSFAST, updatedSourceFile);

    console.log(chalk.green.bold('Transform result for'), filepath);
    const prettyTS = prettierUtil.formatTypescript(updatedComponentSource);
    console.log(prettyTS);
  });
};

program.version(packageJSON.version);

program.command('dump <dir>').action((dir: string, cmd: program.Command) => {
  const tsFiles = getTypescriptFileASTsFromDirectory(dir);
  tsFiles.forEach(({ filepath, ast }: IFileAST, index: number) => {
    console.log('\n\n', chalk.green.bold(' - Processing file'), filepath, '\n');
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
      console.log('\n\n', chalk.blue.bold(`Processing file`), filepath);
      matches.forEach((node: ts.Node, index) => {
        while (ancestor && node.parent && ts.SyntaxKind[node.kind] != ancestor) {
          // console.log(" - Going to parent", ancestor, ts.SyntaxKind[node.parent.kind]);
          node = node.parent;
        }
        dumpASTNode(node, index);
      });
    });
  });

program.command('dump-imports <dir>').action((dir: string, cmd: program.Command) => {
  const scanDirPath = path.join(process.cwd(), dir);
  console.log(chalk.yellow.bold(`Scanning files in`), scanDirPath);

  if (!fs.existsSync(scanDirPath)) {
    console.log(chalk.red.bold(`Directory does note exist`), scanDirPath);
  }

  const tsFiles = glob.sync(`${scanDirPath}/**/*.ts`);
  tsFiles.forEach((filepath: string) => {
    const source = fs.readFileSync(filepath, fileUtil.UTF8);
    const ast = tsquery.ast(source);
    const nodes = tsquery(ast, `ImportDeclaration`);
    nodes.forEach((node, index) => {
      console.log('\n\n', chalk.green.bold(' - Processing file'), filepath, '\n');
      dumpASTNode(node, index);
    });
  });
});

program.command('dump-classes <dir>').action((dir: string, cmd: program.Command) => {
  const scanDirPath = path.join(process.cwd(), dir);
  console.log(chalk.yellow.bold(`Scanning components in`), scanDirPath);

  if (!fs.existsSync(scanDirPath)) {
    console.log(chalk.red.bold(`Directory does note exist`), scanDirPath);
  }

  const tsFiles = glob.sync(`${scanDirPath}/**/*.ts`);
  tsFiles.forEach((filepath: string) => {
    const source = fs.readFileSync(filepath, fileUtil.UTF8);
    const ast = tsquery.ast(source);
    const nodes = tsquery(ast, `ClassDeclaration`);
    nodes.forEach((node, index) => {
      console.log('\n\n', chalk.green.bold(' - Processing file'), filepath, '\n');
      dumpASTNode(node, index);
    });
  });
});

program.command('dump-directives <dir>').action((dir: string, cmd: program.Command) => {
  console.log(chalk.yellow.bold(`Scanning directives in ${dir}`));
});

program
  .command('dump-component-class-decorators <dir>')
  .action((dir: string, cmd: program.Command) => {
    const scanDirPath = path.join(process.cwd(), dir);
    console.log(chalk.yellow.bold(`Scanning component class decorators in ${dir}`));

    if (!fs.existsSync(scanDirPath)) {
      console.log(chalk.red.bold(`Directory does note exist`), scanDirPath);
    }

    const tsFiles = glob.sync(`${scanDirPath}/**/*.ts`);
    tsFiles.forEach((filepath: string) => {
      const source = fs.readFileSync(filepath, fileUtil.UTF8);
      const ast = tsquery.ast(source);
      const nodes = tsquery(ast, `ClassDeclaration Decorator[name.name="Component"]`);
      nodes.forEach((node, index) => {
        console.log('\n\n', chalk.green.bold(' - Processing file'), filepath, '\n');
        dumpASTNode(node, index);
      });
    });
  });

program
  .command('dump-component-attribute-decorators <dir>')
  .action((dir: string, cmd: program.Command) => {
    console.log(chalk.yellow.bold(`Scanning component attribute decorators in ${dir}`));
  });

program.command('dump-interfaces <dir>').action((dir: string, cmd: program.Command) => {
  console.log(chalk.yellow.bold(`Scanning interfaces in ${dir}`));
});

program
  .command('component-transform-add-view-encapsulation-shadow-dom <dir>')
  .action((dir: string, cmd: program.Command) => {
    console.log(chalk.yellow.bold(`Scanning ${dir}`));

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

    generateTypescriptFromTransformationResult(transformationResults);
  });

program
  .command('wrap-component-in-namespace <namespace> <dir>')
  .description('Wraps Component class decorations in a namespace.')
  .action((namespace: string, dir: string, cmd: program.Command) => {
    console.log(chalk.green.bold('Wrapping components in namespaces'), namespace);
    console.log(chalk.yellow.bold(`Scanning ${dir}`));
    const namespaceItems = namespace.split('.');
    console.log('Namespace items', namespaceItems);

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

    generateTypescriptFromTransformationResult(transformationResults);
  });

program
  .command('collect-interface-declarations <dir>')
  .description('Scans typescript files in a directory to pull out classes, interfaces, and enums')
  .action((dir: string, cmd: program.Command) => {
    console.log(chalk.yellow.bold(`Scanning ${dir}`));

    const tsFiles = getTypescriptFileASTsFromDirectory(dir);
    let interfaceMatches = findFilesWithASTMatchingSelector(tsFiles, NgAstSelector.NgInterfaces);
    interfaceMatches = interfaceMatches.filter((fileMatch: IFileASTQueryMatch) => {
      // Filter out all of the test files/specs.
      // TODO (ryan): Make this more robust. Using a regex for test
      //   in the ModuleSpecifier may be overly broad.
      const testResults = tsquery(fileMatch.ast, 'ImportDeclaration[moduleSpecifier.text=/test/]');
      return testResults.length === 0;
    });

    const interfaces: dm.IRootMetadata = getRootMetadataStub();

    // TODO (ryan): Update this to stop using a transform to drive the visitor pattern.
    const transformationResults = interfaceMatches.forEach(({ filepath, source, ast }) => {
      ts.transform(ast, [dm.collectMetadata(interfaces, filepath, dm.rootCollectorCallback)]);
    });

    console.log(chalk.green.bold('Found interfaces'));
    console.log(JSON.stringify(interfaces, null, 2));
  });

program.parse(process.argv);
