import ts, { isNamespaceImport } from "typescript";
import { getObjectLiteralPropertiesAsMap } from "../utils/object-literal-expression.util";
import { stripQuotes } from "../utils/string-literal.util";
import { Property as PipeDecoratorProperty } from './pipe-decorator.property';
import { IPipeClassDecoratorMetadata } from "./pipe.interface";

export const collectPipeClassDecoratorMetadata = (decorator: ts.Decorator | undefined): IPipeClassDecoratorMetadata | undefined => {
  if (decorator && ts.isCallExpression(decorator.expression)) {
    const { expression } = decorator;
    const properties = expression?.arguments[0];

    if (properties && ts.isObjectLiteralExpression(properties)) {
      const decoratorProperties = getObjectLiteralPropertiesAsMap<PipeDecoratorProperty>(properties as ts.ObjectLiteralExpression);

      const nameInitializer = decoratorProperties.get(PipeDecoratorProperty.Name);
      const name = collectNameMetadata(nameInitializer);

      const pureInitializer = decoratorProperties.get(PipeDecoratorProperty.Pure);
      const pure = collectPureMetadata(pureInitializer);

      return {
        name,
        pure,
      }
    }
  }
  
  return;
}

const collectNameMetadata = (expression: ts.Expression | undefined): string => {
  if (expression && ts.isStringLiteral(expression)) {
    const value = stripQuotes(expression);
    if (value.length > 0) {
      return value;
    }
  }
  return '[unknown]';
}

const collectPureMetadata = (expression: ts.Expression | undefined): boolean => {
  if (expression) {
    if (expression.kind === ts.SyntaxKind.FalseKeyword) {
      return true;
    }
  }

  return true;
}