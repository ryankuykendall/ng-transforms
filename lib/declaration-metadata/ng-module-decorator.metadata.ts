import ts from 'typescript';
import { Property as NgModuleDecoratorProperty } from './ng-module-decorator.property';
import { INgModuleClassDecoratorMetadata } from './ng-module.interface';
import { getObjectLiteralPropertiesAsMap } from '../utils/object-literal-expression.util';
import {
  IExportsMetadata,
  IImportsMetadata,
  IProvidersMetadata,
  IEntryComponentsMetadata,
  IBootstrapMetadata,
  IHasExpression,
  IDeclarationsMetadata,
  ISchemasMetadata,
} from './ng-module-decorator.interface';
import { collectExpressionMetadata } from './expression.metadata';

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

    if (
      expression.arguments &&
      expression.arguments[0] &&
      ts.isObjectLiteralExpression(expression.arguments[0])
    ) {
      const properties = expression.arguments[0] as ts.ObjectLiteralExpression;
      const decoratorProperties = getObjectLiteralPropertiesAsMap<NgModuleDecoratorProperty>(
        properties
      );

      // id
      const idInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Id);
      id = collectInitializerMetadataAsString(idInitializer);

      // bootstrap
      const bootstrapInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Bootstrap);
      bootstrap = collectInitializerAsExpressionMetadata<IBootstrapMetadata>(bootstrapInitializer);

      // declarations
      const declarationsInitializer = decoratorProperties.get(
        NgModuleDecoratorProperty.Declarations
      );
      declarations = collectInitializerAsExpressionMetadata<IDeclarationsMetadata>(
        declarationsInitializer
      );

      // entryComponents
      const entryComponentsInitializer = decoratorProperties.get(
        NgModuleDecoratorProperty.EntryComponents
      );
      entryComponents = collectInitializerAsExpressionMetadata<IEntryComponentsMetadata>(
        entryComponentsInitializer
      );

      // exports
      const exportsInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Exports);
      exports = collectInitializerAsExpressionMetadata<IExportsMetadata>(exportsInitializer);

      // imports
      const importsInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Imports);
      imports = collectInitializerAsExpressionMetadata<IImportsMetadata>(importsInitializer);

      // providers
      const providersInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Providers);
      providers = collectInitializerAsExpressionMetadata<IProvidersMetadata>(providersInitializer);

      // schemas
      const schemasInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Schemas);
      schemas = collectInitializerAsExpressionMetadata<ISchemasMetadata>(schemasInitializer);
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

const collectInitializerAsExpressionMetadata = <T extends IHasExpression>(
  initializer: ts.Expression | undefined
): T | undefined => {
  if (initializer) {
    return {
      expression: collectExpressionMetadata(initializer),
    } as T;
  }

  return;
};
