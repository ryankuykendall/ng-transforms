import ts from 'typescript';
import { stripQuotes } from '../utils/string-literal.util';
import { getObjectLiteralPropertiesAsMap } from '../utils/object-literal-expression.util';
import { IDirectiveClassDecoratorMetadata } from './directive.interface';
import { Property as DirectiveDecoratorProperty } from './directive.decorator-property';
import { Property as ComponentDecoratorProperty } from './component.decorator-property';

// Use the superset to identify these
export type ComponentPropertyName = DirectiveDecoratorProperty | ComponentDecoratorProperty;

// This is written to take the call expression so that we can pass the @Component call
//   expression to it too since @Component is a subclass of @Directive.
export const collectDirectiveDecoratorMetadata = (
  decorator: ts.Decorator | undefined
): IDirectiveClassDecoratorMetadata => {
  let selector = '';
  let hostElementBindings: string[] = [];
  let inputs: string[] = [];
  let outputs: string[] = [];
  let providers: string[] = [];
  let queries: string[] = [];
  let exportAs;

  if (decorator && ts.isCallExpression(decorator.expression)) {
    const { expression } = decorator;

    if (expression.arguments && ts.isObjectLiteralExpression(expression.arguments[0])) {
      const properties = expression.arguments[0] as ts.ObjectLiteralExpression;
      const decoratorProperties = getObjectLiteralPropertiesAsMap<ComponentPropertyName>(
        properties
      );

      // Selector
      const selectorInitializer = decoratorProperties.get(DirectiveDecoratorProperty.Selector);
      selector = collectSelectorMetadata(selectorInitializer);

      // hostElementBindings
      const hostElementBindingsInitializer = decoratorProperties.get(
        DirectiveDecoratorProperty.Host
      );
      hostElementBindings = collectHostElementBindingMetadata(hostElementBindingsInitializer);

      // inputs
      const inputsInitializer = decoratorProperties.get(DirectiveDecoratorProperty.Inputs);
      inputs = collectInputsMetadata(inputsInitializer);

      // outputs
      const outputsInitializer = decoratorProperties.get(DirectiveDecoratorProperty.Outputs);
      outputs = collectOutputsMetadata(outputsInitializer);

      // providers
      const providersInitializer = decoratorProperties.get(DirectiveDecoratorProperty.Providers);
      providers = collectProvidersMetadata(providersInitializer);

      // queries
      const queriesInitializer = decoratorProperties.get(DirectiveDecoratorProperty.Queries);
      queries = collectQueriesMetadata(queriesInitializer);

      // exportAs
      const exportAsInitializer = decoratorProperties.get(DirectiveDecoratorProperty.ExportAs);
      exportAs = collectExportAsMetadata(exportAsInitializer);
    }
  }

  return {
    selector,
    hostElementBindings,
    inputs,
    outputs,
    providers,
    queries,
    exportAs,
  };
};

export const collectExportAsMetadata = (
  expression: ts.Expression | undefined
): string | undefined => {
  if (expression && ts.isStringLiteral(expression)) {
    // TODO (ryan): Turn this into a switch statement on SyntaxKind so that we can log
    //   situations where another expression is used.
    return expression.getText();
  }
  return;
};

export const collectSelectorMetadata = (expression: ts.Expression | undefined): string => {
  if (expression && ts.isStringLiteral(expression)) {
    // TODO (ryan): Turn this into a switch statement on SyntaxKind so that we can log
    //   situations where another expression is used.
    return stripQuotes(expression);
  }
  return '';
};

export const collectHostElementBindingMetadata = (
  expression: ts.Expression | undefined
): string[] => {
  if (expression && ts.isObjectLiteralExpression(expression)) {
    return (expression as ts.ObjectLiteralExpression).properties.map(
      (prop: ts.ObjectLiteralElementLike) => {
        // TODO (ryan): Run the Typescript compiler on the property initializer so that we can
        //   further classify whether the initializer is just an ExpressionStatement > StringLiteral
        //   or a more complex ExpressionStatement like ExpressionStatement > ConditionalExpression.
        return prop.getText();
      }
    );
  }

  return [];
};

export const collectInputsMetadata = (expression: ts.Expression | undefined): string[] => {
  if (expression && ts.isArrayLiteralExpression(expression)) {
    return (expression as ts.ArrayLiteralExpression).elements.map((element: ts.Expression) => {
      console.log(' - Input element', element.getText());
      // TODO (ryan): These need to be more finely parsed to accommodate the remapping of identifier
      //   to the attribute representation "'matTreeNodeDefWhen'" vs. "'when: matTreeNodeDefWhen'"
      return element.getText();
    });
  }

  return [];
};

export const collectOutputsMetadata = (expression: ts.Expression | undefined): string[] => {
  if (expression && ts.isArrayLiteralExpression(expression)) {
    return (expression as ts.ArrayLiteralExpression).elements.map((element: ts.Expression) => {
      // TODO (ryan): This need to be further refined for sub properties.
      return element.getText();
    });
  }

  return [];
};

export const collectProvidersMetadata = (expression: ts.Expression | undefined): string[] => {
  if (expression && ts.isArrayLiteralExpression(expression)) {
    return (expression as ts.ArrayLiteralExpression).elements.map((element: ts.Expression) => {
      // TODO (ryan): This need to be further refined for sub types & properties.
      return element.getText();
    });
  }

  return [];
};

export const collectQueriesMetadata = (expression: ts.Expression | undefined): string[] => {
  if (expression && ts.isArrayLiteralExpression(expression)) {
    return (expression as ts.ArrayLiteralExpression).elements.map((element: ts.Expression) => {
      // TODO (ryan): This need to be further refined for sub properties.
      return element.getText();
    });
  }

  return [];
};
