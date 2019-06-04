import ts from 'typescript';
import * as aleUtil from './../../utils/array-literal-expression.util';
import * as oleUtil from './../../utils/object-literal-expression.util';
import * as fileUtil from './../../utils/file.util';

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const DECORATOR_IDENTIFIER = 'Component';
const ENCAPSULATION_PROPERTY_NAME = 'encapsulation';
const TEMPLATE_PROPERTY_NAME = 'template';
const TEMPLATE_URL_PROPERTY_NAME = 'templateUrl';
const STYLES_PROPERTY_NAME = 'styles';
const STYLE_URLS_PROPERTY_NAME = 'styleUrls';

const withComponentDecoratorConfiguration = 
  (workingNode: ts.Node, 
    callback: (callExp: ts.CallExpression, objLitExp: ts.ObjectLiteralExpression) => void) => {
  if (ts.isDecorator(workingNode) && ts.isClassDeclaration(workingNode.parent)) {
    workingNode = ts.getMutableClone(workingNode);
    const callExpression = (workingNode as ts.Decorator).expression as ts.CallExpression;
    const identifier = callExpression.expression;
    const [objLiteralExpression] = callExpression.arguments;

    if (identifier && 
        ts.isIdentifier(identifier) &&
        identifier.escapedText === DECORATOR_IDENTIFIER && 
        ts.isObjectLiteralExpression(objLiteralExpression)) {
      // Process the contents of the object literal.
      callback.call(null, 
        callExpression as ts.CallExpression,
        objLiteralExpression as ts.ObjectLiteralExpression);
    }
  }
};

const inlineCSSFromFile = 
  (callExp: ts.CallExpression, objLitExp: ts.ObjectLiteralExpression, componentDirectory: string):void => {

  if (oleUtil.hasKey(objLitExp, STYLE_URLS_PROPERTY_NAME)) {
    let properties = Array.from(objLitExp.properties);

    const styleUrlsArrayLE = oleUtil.getPropertyAsArrayLiteralExpression(properties, STYLE_URLS_PROPERTY_NAME);
    if (styleUrlsArrayLE) {
      const stylesheetFilenames = aleUtil.mapToArrayOfStrings(styleUrlsArrayLE);
      if (stylesheetFilenames.length > 0) {
        const stylesheets = stylesheetFilenames.map((ssFilename) => {
          const ssFilepath = path.join(componentDirectory, ssFilename);
          if (fs.existsSync(ssFilepath)) {
            return fs.readFileSync(ssFilepath, fileUtil.UTF8);
          }
  
          // TODO: Probably better to throw an error...
          return `/** Missing stylesheet ${ssFilename} **/`;
        })
        .join("\n\n");

        const stylesProperty = ts.createPropertyAssignment(
          STYLES_PROPERTY_NAME,
          ts.createStringLiteral(stylesheets)
        );

        properties = oleUtil.removeProperty(properties, STYLE_URLS_PROPERTY_NAME);
        properties.push(stylesProperty);

        callExp.arguments = ts.createNodeArray(
          [ts.createObjectLiteral(properties as ReadonlyArray<ts.ObjectLiteralElementLike>)],
          true
        );
      }
    }
  }
}

export function inlineCSSFromFileTransformer<T extends ts.Node>(filepath: string): ts.TransformerFactory<T> {
  return (context) => {
    const componentDirectory = path.dirname(filepath);
    const visit: ts.Visitor = (node) => {
      let workingNode = node;

      withComponentDecoratorConfiguration(workingNode, (callExp, objLitExp) => {
        inlineCSSFromFile(callExp, objLitExp, componentDirectory);
      });

      return ts.visitEachChild(workingNode, (child) => visit(child), context);
    };

    return (node) => ts.visitNode(node, visit);
  };
};