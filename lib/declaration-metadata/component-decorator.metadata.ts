import ts from 'typescript';

import { IComponentClassDecoratorMetadata, IProvider, ModuleIdType } from './component.interface';
import { getDecoratorMap } from '../utils/decorator.util';
import { NgClassDecorator } from '../utils/decorator-identifier.util';
import { getObjectLiteralPropertiesAsMap } from '../utils/object-literal-expression.util';
import { ComponentPropertyName } from './directive-decorator.metadata';

import {
  Property as ComponentDecoratorProperty,
  ChangeDetectionStrategy,
  CHANGE_DETECTION_STRATEGY,
  VIEW_ENCAPSULATION,
  ViewEncapsulation,
} from './component-decorator.property';
import { stripQuotes } from '../utils/string-literal.util';
import { mapToArrayOfStrings } from '../utils/array-literal-expression.util';
import * as logger from './../utils/logger.util';

export const collectComponentClassDecoratorMetadata = (
  node: ts.ClassDeclaration
): IComponentClassDecoratorMetadata => {
  let changeDetection;
  let encapsulation;
  let moduleId;
  let preserveWhitespaces;
  let template;
  let templateUrl;
  let styles;
  let styleUrls;
  let viewProviders;

  const classDecoratorMap = getDecoratorMap(node);
  const decorator = classDecoratorMap.get(NgClassDecorator.Component);

  if (decorator && ts.isCallExpression(decorator.expression)) {
    const { expression } = decorator;

    if (expression.arguments && ts.isObjectLiteralExpression(expression.arguments[0])) {
      const properties = expression.arguments[0] as ts.ObjectLiteralExpression;
      const decoratorProperties = getObjectLiteralPropertiesAsMap<ComponentPropertyName>(
        properties
      );

      // changeDetection
      const changeDetectionInitializer = decoratorProperties.get(
        ComponentDecoratorProperty.ChangeDetection
      );
      changeDetection = collectChangeDetectionMetadata(changeDetectionInitializer);

      // encapsulation
      const encapsulationInitializer = decoratorProperties.get(
        ComponentDecoratorProperty.Encapsulation
      );
      encapsulation = collectEncapsulationMetadata(encapsulationInitializer);

      // moduleId
      const moduleIdInitializer = decoratorProperties.get(ComponentDecoratorProperty.ModuleId);
      moduleId = collectModuleIdMetadata(moduleIdInitializer);

      // preserveWhitespaces
      const preserveWhitespacesInitializer = decoratorProperties.get(
        ComponentDecoratorProperty.PreserveWhitespaces
      );
      preserveWhitespaces = collectPreserveWhitespacesMetadata(preserveWhitespacesInitializer);

      // styles
      const stylesInitializer = decoratorProperties.get(ComponentDecoratorProperty.Styles);
      styles = collectStylesMetadata(stylesInitializer);

      // stylesUrl
      const styleUrlsInitializer = decoratorProperties.get(ComponentDecoratorProperty.StyleUrls);
      styleUrls = collectStyleUrlsMetadata(styleUrlsInitializer);

      // template
      const templateInitializer = decoratorProperties.get(ComponentDecoratorProperty.Template);
      template = collectTemplateMetadata(templateInitializer);

      // templateUrl
      const templateUrlInitializer = decoratorProperties.get(
        ComponentDecoratorProperty.TemplateUrl
      );
      templateUrl = collectTemplateUrlMetadata(templateUrlInitializer);

      // viewProviders
      const viewProvidersInitializer = decoratorProperties.get(
        ComponentDecoratorProperty.ViewProviders
      );
      viewProviders = collectViewProviderMetadata(viewProvidersInitializer);
    }
  }

  return {
    changeDetection,
    encapsulation,
    moduleId,
    preserveWhitespaces,
    styles,
    styleUrls,
    template,
    templateUrl,
    viewProviders,
  };
};

const collectChangeDetectionMetadata = (
  initializer: ts.Expression | undefined
): ChangeDetectionStrategy | undefined => {
  if (
    initializer &&
    ts.isPropertyAccessExpression(initializer) &&
    initializer.expression.getText() === CHANGE_DETECTION_STRATEGY
  ) {
    return initializer.name.getText() as ChangeDetectionStrategy;
  }

  return;
};

// TODO (ryan): Generalize this method so that it can be used by both
//   encapsulation as well as changeDetection
const collectEncapsulationMetadata = (
  initializer: ts.Expression | undefined
): ViewEncapsulation | undefined => {
  if (
    initializer &&
    ts.isPropertyAccessExpression(initializer) &&
    initializer.expression.getText().trim() === VIEW_ENCAPSULATION
  ) {
    return initializer.name.getText() as ViewEncapsulation;
  }

  return;
};

const collectModuleIdMetadata = (
  initializer: ts.Expression | undefined
): ModuleIdType | undefined => {
  if (initializer) {
    const COMMONJS_MODULE = 'module';
    const COMMONJS_MODULE_ID = 'id';
    const SYSTEMJS_MODULE_ID = '__moduleName';

    if (ts.isPropertyAccessExpression(initializer)) {
      // NOTE (ryan): This will only handle CommonJS
      if (
        initializer.expression.getText() === COMMONJS_MODULE &&
        initializer.name.getText() === COMMONJS_MODULE_ID
      ) {
        return ModuleIdType.CommonJS;
      }
    }

    if (ts.isIdentifier(initializer) && initializer.getText() === SYSTEMJS_MODULE_ID) {
      return ModuleIdType.SystemJS;
    }

    logger.error('Unhandled initializer type collectModuleIdMetadata', initializer);
  }

  return;
};

const collectPreserveWhitespacesMetadata = (
  initializer: ts.Expression | undefined
): boolean | undefined => {
  if (initializer && ts.isPropertyAssignment(initializer)) {
    switch (initializer.initializer.kind) {
      case ts.SyntaxKind.FalseKeyword:
        return false;
      case ts.SyntaxKind.TrueKeyword:
        return true;
    }
  }

  return;
};

const collectStylesMetadata = (initializer: ts.Expression | undefined): string[] | undefined => {
  if (initializer && ts.isArrayLiteralExpression(initializer)) {
    return mapToArrayOfStrings(initializer as ts.ArrayLiteralExpression);
  }

  return;
};

const collectStyleUrlsMetadata = (initializer: ts.Expression | undefined): string[] | undefined => {
  if (initializer && ts.isArrayLiteralExpression(initializer)) {
    return mapToArrayOfStrings(initializer as ts.ArrayLiteralExpression);
  }

  return;
};

const collectTemplateMetadata = (initializer: ts.Expression | undefined): string | undefined => {
  if (initializer) {
    return stripQuotes(initializer);
  }

  return;
};

const collectTemplateUrlMetadata = (initializer: ts.Expression | undefined): string | undefined => {
  if (initializer) {
    return stripQuotes(initializer);
  }

  return;
};

// TODO (ryan): Update this to be more useful once we can track down a good example
//   of where this is used (It is currently not used in Angular Material.)
const collectViewProviderMetadata = (
  initializer: ts.Expression | undefined
): IProvider[] | undefined => {
  if (initializer && ts.isArrayLiteralExpression(initializer)) {
    return initializer.elements.map(
      (provider: ts.Expression): IProvider => {
        return {
          raw: provider.getText(),
        };
      }
    );
  }

  return;
};
