import ts from 'typescript';
import { Property as NgModuleDecoratorProperty } from './ng-module-decorator.property';
import { INgModuleClassDecoratorMetadata } from './ng-module.interface';
import { getObjectLiteralPropertiesAsMap } from '../utils/object-literal-expression.util';
import {
  IExportMetadata,
  IImportMetadata,
  IProviderMetadata,
  IEntryComponentsMetadata,
} from './ng-module-decorator.interface';
import { collectExpressionMetadata } from './expression.metadata';
import { ExpressionMetadata } from './expression.interface';

export const collectNgModuleDecoratorMetadata = (
  decorator: ts.Decorator | undefined
): INgModuleClassDecoratorMetadata | undefined => {
  if (decorator && ts.isCallExpression(decorator.expression)) {
    const { expression } = decorator;

    let id;
    let bootstrap;
    let declarations;
    let entryComponents;
    let exports;
    let imports;
    let providers;
    let schemas;

    if (expression.arguments && ts.isObjectLiteralExpression(expression.arguments[0])) {
      const properties = expression.arguments[0] as ts.ObjectLiteralExpression;
      const decoratorProperties = getObjectLiteralPropertiesAsMap<NgModuleDecoratorProperty>(
        properties
      );

      // id
      const idInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Id);
      id = collectInitializerMetadataAsString(idInitializer);

      // bootstrap
      const bootstrapInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Bootstrap);
      bootstrap = collectInitializerMetadataAsString(bootstrapInitializer);

      // declarations
      const declarationsInitializer = decoratorProperties.get(
        NgModuleDecoratorProperty.Declarations
      );
      declarations = collectInitializerMetadataAsString(declarations);

      // entryComponents
      const entryComponentsInitializer = decoratorProperties.get(
        NgModuleDecoratorProperty.EntryComponents
      );
      entryComponents = collectEntryComponentsMetadata(entryComponents);

      // exports
      const exportsInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Exports);
      exports = collectExportsMetadata(exportsInitializer);

      // imports
      const importsInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Imports);
      imports = collectImportsMetadata(importsInitializer);

      // providers
      const providersInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Providers);
      providers = collectProvidersMetadata(providersInitializer);

      // schemas
      const schemasInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Schemas);
      schemas = collectInitializerMetadataAsString(schemasInitializer);
    }

    return {
      id,
      bootstrap,
      declarations,
      entryComponents,
      exports,
      imports,
      providers,
      schemas,
    };
  }

  return;
};

const collectInitializerMetadataAsString = (
  initializer: ts.Expression | undefined
): string | undefined => {
  if (initializer) {
    return initializer.getText();
  }

  return;
};

const collectAsArrayOfExpressionMetadata = (node: ts.Expression): ExpressionMetadata[] => {
  let expressions: ExpressionMetadata[] = [];
  if (ts.isArrayLiteralExpression(node)) {
    // NOTE (ryan): This might be relying too much on Angular of passing an
    //   array of identifiers, but we can use a post processing step to expand
    //   items in the else case.
    expressions = node.elements.map(
      (childExp: ts.Expression): ExpressionMetadata => {
        return collectExpressionMetadata(childExp);
      }
    );
  } else {
    expressions = [collectExpressionMetadata(node)];
  }

  return expressions;
};

const collectEntryComponentsMetadata = (
  initializer: ts.Expression | undefined
): IEntryComponentsMetadata | undefined => {
  if (initializer) {
    return {
      expressions: collectAsArrayOfExpressionMetadata(initializer),
    };
  }

  return;
};

const collectExportsMetadata = (
  initializer: ts.Expression | undefined
): IExportMetadata | undefined => {
  if (initializer) {
    return {
      expressions: collectAsArrayOfExpressionMetadata(initializer),
    };
  }

  return;
};

const collectImportsMetadata = (
  initializer: ts.Expression | undefined
): IImportMetadata | undefined => {
  if (initializer) {
    return {
      expressions: collectAsArrayOfExpressionMetadata(initializer),
    };
  }

  return;
};

const collectProvidersMetadata = (
  initializer: ts.Expression | undefined
): IProviderMetadata | undefined => {
  if (initializer) {
    return {
      expressions: collectAsArrayOfExpressionMetadata(initializer),
    };
  }

  return;
};
