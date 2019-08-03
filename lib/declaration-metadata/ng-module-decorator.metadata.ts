import ts from 'typescript';
import { Property as NgModuleDecoratorProperty } from './ng-module-decorator.property';
import { INgModuleClassDecoratorMetadata } from './ng-module.interface';
import { getObjectLiteralPropertiesAsMap } from '../utils/object-literal-expression.util';

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
      entryComponents = collectInitializerMetadataAsString(entryComponents);

      // exports
      const exportsInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Exports);
      exports = collectInitializerMetadataAsString(exportsInitializer);

      // imports
      const importsInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Imports);
      imports = collectInitializerMetadataAsString(importsInitializer);

      // providers
      const providersInitializer = decoratorProperties.get(NgModuleDecoratorProperty.Providers);
      providers = collectInitializerMetadataAsString(providersInitializer);

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
