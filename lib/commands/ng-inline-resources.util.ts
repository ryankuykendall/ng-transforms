import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import * as fileUtil from './../utils/file.util';
import * as aleUtil from './../utils/array-literal-expression.util';
import * as oleUtil from './../utils/object-literal-expression.util';
import { Property as cdProperty } from './../declaration-metadata/component-decorator.property';

import logger from './../utils/logger.util';

import { IFileASTQueryMatch } from './../interfaces/ast-file.interface';

import {
  IComponentDecoratorRef,
  IComponentInlineModel,
  IComponentInlineBuild,
} from './../transforms/components/inline-resources.interface';

const CSS_FILE_EXTENSION = 'css';
const SCSS_FILE_EXTENSION = 'scss';
const SCSS_REPLACE_REGEXP = /\.scss$/;

export const generateComponentDecoratorRefs = (
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

export const generateComponentInlineModel = (
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

export const loadAllComponentTemplateUrlContents = (
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

export const loadComponentTemplateUrlContents = (
  build: IComponentInlineBuild
): IComponentInlineModel => {
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

export const loadAllComponentStyleUrlsContent = (
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
