import ts from 'typescript';
import { IDirectiveMetadata, IDirectiveClassDecoratorMetadata } from './directive.interface';
import { collectClassMetadata } from './class.metadata';
import { IClassMetadata } from './class.interface';
import { getDecoratorMap } from '../utils/decorator.util';
import { DIRECTIVE } from '../utils/decorator-identifier.util';

const enum DirectiveDecoratorPropertyName {
  ExportAs = 'exportAs',
  Host = 'host',
  Inputs = 'inputs',
  Outputs = 'outputs',
  Providers = 'providers',
  Queries = 'queries',
  Selector = 'selector',
}

const enum ComponentDecoratorPropertyName {
  Styles = 'styles',
  StyleUrls = 'styleUrls',
  Template = 'template',
  TemplateUrl = 'templateUrl',
}

// Use the superset to identify these
export type ComponentPropertyName = DirectiveDecoratorPropertyName | ComponentDecoratorPropertyName;

export const collectDirectiveMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IDirectiveMetadata => {
  const classMetadata: IClassMetadata = collectClassMetadata(node, filepath);
  // Continue collecting directive specific metadata
  const classDecoratorMap = getDecoratorMap(node);
  const directiveDecorator = classDecoratorMap.get(DIRECTIVE);
  const directiveDecoratorMetadata = collectDirectiveDecoratorMetadata(directiveDecorator);

  return {
    ...(directiveDecoratorMetadata as IDirectiveClassDecoratorMetadata),
    ...classMetadata,
    // NOTE (ryan): bootstrappingTemplate to be created in post processing
    //   step.
    bootstrappingTemplate: '',
  };
};

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
    const expression = decorator.expression;

    if (expression.arguments && ts.isObjectLiteralExpression(expression.arguments[0])) {
      const properties = expression.arguments[0] as ts.ObjectLiteralExpression;
      const decoratorProperties = getDirectiveDecoratorProperties(properties);

      // Selector
      const selectorProp = decoratorProperties.get(DirectiveDecoratorPropertyName.Selector);
      selector = collectSelectorMetadata(selectorProp);

      // hostElementBindings
      const hostElementBindingsProp = decoratorProperties.get(DirectiveDecoratorPropertyName.Host);
      console.log('Host', hostElementBindingsProp && hostElementBindingsProp.getText());
      hostElementBindings = collectHostElementBindingMetadata(hostElementBindingsProp);

      // inputs
      const inputsProp = decoratorProperties.get(DirectiveDecoratorPropertyName.Inputs);
      console.log('Inputs', inputsProp && inputsProp.getText());
      inputs = collectInputsMetadata(inputsProp);

      // outputs
      const outputsProp = decoratorProperties.get(DirectiveDecoratorPropertyName.Outputs);
      console.log('Outputs', outputsProp && outputsProp.getText());
      outputs = collectOutputsMetadata(outputsProp);

      // exportAs
      const exportAsProp = decoratorProperties.get(DirectiveDecoratorPropertyName.ExportAs);
      exportAs = collectExportAsMetadata(exportAsProp);
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

const getDirectiveDecoratorProperties = (
  objectLiteral: ts.ObjectLiteralExpression
): Map<ComponentPropertyName, ts.Expression> => {
  const properties: Map<ComponentPropertyName, ts.Expression> = new Map();
  objectLiteral.properties.forEach((prop: ts.ObjectLiteralElementLike) => {
    if (ts.isPropertyAssignment(prop)) {
      const paProp = prop as ts.PropertyAssignment;
      const key = paProp.name.getText();
      const value = paProp.initializer;
      properties.set(key as ComponentPropertyName, value);
    }
  });

  return properties;
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
    return expression.getText();
  }
  return '';
};

export const collectHostElementBindingMetadata = (
  expression: ts.Expression | undefined
): string[] => {
  console.log('collectHost SyntaxKind', expression && ts.SyntaxKind[expression.kind]);

  if (expression && ts.isObjectLiteralExpression(expression)) {
    return (expression as ts.ObjectLiteralExpression).properties.map(
      (prop: ts.ObjectLiteralElementLike) => {
        // TODO (ryan): Run the Typescript compiler on the property initializer so that we can
        //   further classify whether the initializer is just an ExpressionStatement > StringLiteral
        //   or a more complex ExpressionStatement like ExpressionStatement > ConditionalExpression.
        console.log(' - Host property', prop.getText());
        return prop.getText();
      }
    );
  }

  return [];
};

export const collectInputsMetadata = (expression: ts.Expression | undefined): string[] => {
  console.log('collectInputs SyntaxKind', expression && ts.SyntaxKind[expression.kind]);

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
  console.log('collectOutputs SyntaxKind', expression && ts.SyntaxKind[expression.kind]);

  if (expression && ts.isArrayLiteralExpression(expression)) {
    return (expression as ts.ArrayLiteralExpression).elements.map((element: ts.Expression) => {
      console.log(' - Input element', element.getText());
      return element.getText();
    });
  }

  return [];
};
