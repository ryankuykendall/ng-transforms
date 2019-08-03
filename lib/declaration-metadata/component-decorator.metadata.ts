import ts from 'typescript';

import { IComponentClassDecoratorMetadata } from './component.interface';
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
  let preserveWhitespaces;
  let template;
  let templateUrl;
  let styles;
  let styleUrls;

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
    }
  }

  return {
    changeDetection,
    encapsulation,
    preserveWhitespaces,
    styles,
    styleUrls,
    template,
    templateUrl,
  };
};

const collectChangeDetectionMetadata = (
  expression: ts.Expression | undefined
): ChangeDetectionStrategy | undefined => {
  if (
    expression &&
    ts.isPropertyAccessExpression(expression) &&
    expression.expression.getText() === CHANGE_DETECTION_STRATEGY
  ) {
    return expression.name.getText() as ChangeDetectionStrategy;
  }

  return;
};

// TODO (ryan): Generalize this method so that it can be used by both
//   encapsulation as well as changeDetection
const collectEncapsulationMetadata = (
  expression: ts.Expression | undefined
): ViewEncapsulation | undefined => {
  if (
    expression &&
    ts.isPropertyAccessExpression(expression) &&
    expression.expression.getText().trim() === VIEW_ENCAPSULATION
  ) {
    return expression.name.getText() as ViewEncapsulation;
  }

  return;
};

const collectPreserveWhitespacesMetadata = (
  expression: ts.Expression | undefined
): boolean | undefined => {
  if (expression && ts.isPropertyAssignment(expression)) {
    switch (expression.initializer.kind) {
      case ts.SyntaxKind.FalseKeyword:
        return false;
      case ts.SyntaxKind.TrueKeyword:
        return true;
    }
  }

  return;
};

const collectStylesMetadata = (expression: ts.Expression | undefined): string[] | undefined => {
  if (expression && ts.isArrayLiteralExpression(expression)) {
    return mapToArrayOfStrings(expression as ts.ArrayLiteralExpression);
  }

  return;
};

const collectStyleUrlsMetadata = (expression: ts.Expression | undefined): string[] | undefined => {
  if (expression && ts.isArrayLiteralExpression(expression)) {
    return mapToArrayOfStrings(expression as ts.ArrayLiteralExpression);
  }

  return;
};

const collectTemplateMetadata = (expression: ts.Expression | undefined): string | undefined => {
  if (expression) {
    return stripQuotes(expression);
  }

  return;
};

const collectTemplateUrlMetadata = (expression: ts.Expression | undefined): string | undefined => {
  if (expression) {
    return stripQuotes(expression);
  }

  return;
};
