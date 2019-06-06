#!/usr/bin/env node

import program from 'commander';
import ts from 'typescript';
import { tsquery } from '@phenomnomnominal/tsquery';

import * as ct from './lib/component.transform';
import * as cdt from './lib/transforms/components/component-decorator.transform';
import * as fileUtil from './lib/utils/file.util';
import * as prettierUtil from './lib/utils/prettier.util';

import chalk from 'chalk';
import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';

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

const printer: ts.Printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
});

enum NgAstSelector {
  ComponentDecoratorContainingTemplateUrl = "ClassDeclaration Decorator:has(Identifier[name='Component']) PropertyAssignment:has(Identifier[name='templateUrl']) StringLiteral",
  ComponentDecoratorContainingStyleUrls = "ClassDeclaration Decorator:has(Identifier[name='Component']) PropertyAssignment:has(Identifier[name='styleUrls']) StringLiteral",
  // For the following, would still need to backtrack to ImportDeclaration
  NgImportComponentDecoratorFromCore = "ImportDeclaration:has(ImportClause:has(NamedImports ImportSpecifier Identifier[name='Component'])) StringLiteral[value=/@angular/][value=/core/]",
}

interface IFileAST {
  filepath: string;
  source: string;
  ast: ts.Node;
}

interface IFileASTQueryMatch extends IFileAST {
  matches: ts.Node[];
}

const dumpASTNode = (node: ts.Node, index: number = 0, depth: number = 0, indent: number = 4) => {
  const kind = ts.SyntaxKind[node.kind];
  const summary = node
    .getText()
    .replace(/\n/g, ' ')
    .substring(0, 32);
  const attrs = Object.keys(node).filter(k => !TS_NODE_BASE_ATTRS.has(k));
  console.log(
    `${index}.`.padStart(depth * indent, ' '),
    chalk.yellow(kind),
    attrs.join(', '),
    summary
  );
  let childIndex = 0;
  node.forEachChild((node: ts.Node) => {
    dumpASTNode(node, childIndex, depth + 1, indent);
    childIndex++;
  });
};

const getTypescriptFileASTsFromDirectory = (dir: string): IFileAST[] => {
  const scanDirPath = path.join(process.cwd(), dir);
  console.log(chalk.yellow.bold(`Scanning files in`), scanDirPath);

  if (!fs.existsSync(scanDirPath)) {
    console.log(chalk.red.bold(`Directory does note exist`), scanDirPath);
  }

  const tsFiles = glob.sync(`${scanDirPath}/**/*.ts`);
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

program.version(packageJSON.version);

program.command('dump <dir>').action((dir: string, cmd: program.Command) => {
  const tsFiles = getTypescriptFileASTsFromDirectory(dir);
  tsFiles.forEach(({ filepath, ast }: IFileAST, index: number) => {
    console.log('\n\n', chalk.green.bold(' - Processing file'), filepath, '\n');
    dumpASTNode(ast, index);
  });
});

program
  .command('dump-selector <selector> <dir>')
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

    componentDecoratorImportMatches.forEach(({ filepath, source, ast }) => {
      const result: ts.TransformationResult<ts.SourceFile> = ts.transform(ast, [
        ct.importViewEncapsulationFromAngularCoreTransformer(),
        ct.addViewEncapsulationShadowDomToComponentDecoratorTransformer(),
        ct.inlineHTMLTemplateFromFileInComponentDecoratorTransformer(filepath),
        cdt.inlineCSSFromFileTransformer(filepath),
      ]) as ts.TransformationResult<ts.SourceFile>;

      const updatedComponentSFAST = result.transformed[0];
      const updatedFilepath = `${path.basename(filepath)}.ng-element.ts`;
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
  });

program.parse(process.argv);
