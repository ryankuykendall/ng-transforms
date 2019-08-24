import ts from 'typescript';
import { IInjectableClassDecoratorMetadata, IProvidedInMetadata } from './injectable.interface';
import { getObjectLiteralPropertiesAsMap } from '../utils/object-literal-expression.util';
import { Property as InjectableDecoratorProperty } from './injectable-decorator.property';
import logger from '../utils/logger.util';
import { stripQuotes } from '../utils/string-literal.util';
import { collectExpressionMetadata } from './expression.metadata';

export const collectInjectableClassDecoratorMetadata = (
  decorator: ts.Decorator | undefined
): IInjectableClassDecoratorMetadata | undefined => {
  let providedIn;

  if (decorator && ts.isCallExpression(decorator.expression)) {
    const { expression } = decorator;

    if (
      expression.arguments &&
      expression.arguments[0] &&
      ts.isObjectLiteralExpression(expression.arguments[0])
    ) {
      const properties = expression.arguments[0] as ts.ObjectLiteralExpression;
      const decoratorProperties = getObjectLiteralPropertiesAsMap<InjectableDecoratorProperty>(
        properties
      );

      // providedIn
      const providedInInitializer = decoratorProperties.get(InjectableDecoratorProperty.ProvidedIn);
      providedIn = collectProvidedInMetadata(providedInInitializer);
    }
  }

  return {
    providedIn,
  };
};

const PROVIDED_IN_ROOT = 'root';

const collectProvidedInMetadata = (
  expression: ts.Expression | undefined
): IProvidedInMetadata | undefined => {
  if (expression) {
    const metadata: IProvidedInMetadata = {
      root: false,
    };

    const expressionMetadata = collectExpressionMetadata(expression);
    metadata.expression = expressionMetadata;

    if (ts.isStringLiteral(expression)) {
      const value = stripQuotes(expression);
      if (value === PROVIDED_IN_ROOT) {
        metadata.root = true;
        metadata.expression = undefined;
      }
    }

    return metadata;
  }

  return;
};
