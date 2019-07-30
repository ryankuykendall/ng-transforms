import ts from 'typescript';
import {
  IComponentMetadata,
  IContentChildMemberMetadata,
  IContentChildrenMemberMetadata,
  IInputMemberMetadata,
  IHostBindingMemberMetadata,
  IOutputMemberMetadata,
  IHostListenerMemberMetadata,
  IConstructorParameterMetadata,
  IConstructorParameterAttribute,
  ConstructorParameterRefType,
  IConstructorParameterRefMetadata,
  ContentChildDecoratorOption,
  ContentChildrenDecoratorOption,
  IComponentClassDecoratorMetadata,
} from './component.interface';
import {
  collectClassMetadata,
  getMemberDistributionWithIdentifiersAndGroups,
  IMember,
} from './class.metadata';
import {
  NgClassDecorator,
  NgDirectiveClassMemberDecorator,
  NgComponentClassMemberDecorator,
} from './../utils/decorator-identifier.util';
import * as idUtil from './../utils/identifier.util';
import {
  getArgumentAtPositionAsString,
  getArgumentAtPositionAsArrayOfStrings,
} from './../utils/call-expression.util';
import { ClassMetadataGroup, IClassMetadata } from './class.interface';
import { getDecoratorMap } from '../utils/decorator.util';
import { IMethodParameter } from './method.interface';
import { IType } from './type.interface';
import {
  hasKey,
  getPropertyAsBoolean,
  getPropertyAsGetFullText,
  getPropertyAsExpression,
  getObjectLiteralPropertiesAsMap,
} from '../utils/object-literal-expression.util';
import { collectExpressionMetadata } from './expression.metadata';
import { ExpressionMetadata } from './expression.interface';
import {
  collectDirectiveClassDecoratorMetadataFor,
  ComponentPropertyName,
} from './directive.metadata';
import { Property as ComponentDecoratorProperty } from './component.decorator-property';
import { stripQuotes } from '../utils/string-literal.util';
import { mapToArrayOfStrings } from '../utils/array-literal-expression.util';

// TODO (ryan): Angular Components are a subclass of Directive Behavior.
//  Should a good deal of this be moved to the directive.metadata file?
//  Or should it be shared?

/**
 * TODOs (ryan):
 *   1. Make sure to capture the templateUrl filename, and styleUrls filenames; make sure to include it as a resolved path.
 *   2. Add metadata for identifying .scss as a dependency
 *   3. Capture the template & css contents itself too?
 *   4. Inspect component template to identify slots.
 *   5. Capture SCSS vars and transform them to CSS vars?
 **/

export const collectComponentMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IComponentMetadata => {
  const directiveDecoratorMetadata = collectDirectiveClassDecoratorMetadataFor(
    node,
    NgClassDecorator.Component
  );

  const componentDecoratorMetadata = collectComponentClassDecoratorMetadata(node);

  const classMetadata = collectClassMetadata(node, filepath);
  const distribution = getMemberDistributionWithIdentifiersAndGroups(node);
  const constructorParameterMetadata = collectConstructorParameterMetadata(
    distribution,
    classMetadata
  );
  const inputMembers = collectInputMemberMetadata(distribution);
  const hostBindingMembers = collectHostBindingMemberMetadata(distribution);
  const hostListenerMembers = collectHostListenerMemberMetadata(distribution);
  const outputMembers = collectOutputMemberMetadata(distribution);
  const contentChildMembers = collectContentChildMemberMetadata(distribution);
  const contentChildrenMembers = collectContentChildrenMemberMetadata(distribution);

  // Continue building out component specific metadata

  return {
    // Decorators
    ...directiveDecoratorMetadata,
    ...componentDecoratorMetadata,

    // Class Members
    ...classMetadata,

    // Class Member Decorator Metadata
    constructorParameterMetadata,
    inputMembers,
    hostBindingMembers,
    hostListenerMembers,
    outputMembers,
    contentChildMembers,
    contentChildrenMembers,

    // Placeholder for template
    ngTemplate: '',
  };
};

const collectComponentClassDecoratorMetadata = (
  node: ts.ClassDeclaration
): IComponentClassDecoratorMetadata => {
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

      const stylesProp = decoratorProperties.get(ComponentDecoratorProperty.Styles);
      styles = collectStylesMetadata(stylesProp);

      const styleUrlsProp = decoratorProperties.get(ComponentDecoratorProperty.StyleUrls);
      styleUrls = collectStyleUrlsMetadata(styleUrlsProp);

      // template
      const templateProp = decoratorProperties.get(ComponentDecoratorProperty.Template);
      template = collectTemplateMetadata(templateProp);

      // templateUrl
      const templateUrlProp = decoratorProperties.get(ComponentDecoratorProperty.TemplateUrl);
      templateUrl = collectTemplateUrlMetadata(templateUrlProp);
    }
  }

  return {
    styles,
    styleUrls,
    template,
    templateUrl,
  };
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

const collectConstructorParameterMetadata = (
  distribution: IMember[],
  classMetadata: IClassMetadata
): IConstructorParameterMetadata | undefined => {
  const constructorMember: IMember | undefined = distribution.filter(
    (member: IMember) => member.in === ClassMetadataGroup.Constructor
  )[0];

  if (constructorMember) {
    const constructorDec = constructorMember.member as ts.ConstructorDeclaration;
    const metadata: IConstructorParameterMetadata = {
      attributes: [],
      refs: [],
    };

    // Build-up map of constructor parameter types:
    const parameterTypeMap = new Map<string, string>();
    if (classMetadata.constructorDef) {
      classMetadata.constructorDef.parameters.forEach((param: IMethodParameter) => {
        parameterTypeMap.set(param.identifier, param.type);
      });
    }

    // Extract metadata from parameter decorators.
    constructorDec.parameters.forEach((param: ts.ParameterDeclaration) => {
      const identifier = idUtil.getName(param as idUtil.INameableProxy);
      const paramDecoratorMap = getDecoratorMap(param);

      // Handle attributes
      const attributeDecorator = paramDecoratorMap.get(NgDirectiveClassMemberDecorator.Attribute);
      if (attributeDecorator && ts.isDecorator(attributeDecorator)) {
        const attributeName = getArgumentAtPositionAsString(attributeDecorator, 0);
        metadata.attributes.push({
          identifier,
          attributeName,
        } as IConstructorParameterAttribute);
      }

      // Handle Refs
      const parameterType = parameterTypeMap.get(identifier);
      if (Object.values(ConstructorParameterRefType).includes(parameterType)) {
        metadata.refs.push({
          identifier,
          type: parameterType as ConstructorParameterRefType,
        } as IConstructorParameterRefMetadata);
      }
    });

    return metadata;
  }

  return;
};

const collectInputMemberMetadata = (distribution: IMember[]): IInputMemberMetadata[] => {
  return distribution
    .filter((member: IMember) => member.decorators.has(NgDirectiveClassMemberDecorator.Input))
    .map(
      (member: IMember): IInputMemberMetadata => {
        const { identifier } = member;
        let bindingPropertyName = undefined;
        const decorator = member.decorators.get(NgDirectiveClassMemberDecorator.Input);
        if (decorator) {
          bindingPropertyName = getBindingPropertyName(decorator);
        }
        return {
          identifier,
          in: member.in,
          bindingPropertyName,
        } as IInputMemberMetadata;
      }
    );
};

const getBindingPropertyName = (decorator: ts.Decorator): string | undefined => {
  return getArgumentAtPositionAsString(decorator, 1);
};

const collectHostBindingMemberMetadata = (
  distribution: IMember[]
): IHostBindingMemberMetadata[] => {
  return distribution
    .filter((member: IMember) => member.decorators.has(NgDirectiveClassMemberDecorator.HostBinding))
    .map((member: IMember) => {
      const { identifier } = member;
      let hostPropertyName;
      const decorator = member.decorators.get(NgDirectiveClassMemberDecorator.HostBinding);
      if (decorator) {
        hostPropertyName = getHostPropertyName(decorator);
      }
      return {
        identifier,
        in: member.in,
        hostPropertyName,
      } as IHostBindingMemberMetadata;
    });
};

const collectHostListenerMemberMetadata = (
  distribution: IMember[]
): IHostListenerMemberMetadata[] => {
  return distribution
    .filter((member: IMember) =>
      member.decorators.has(NgDirectiveClassMemberDecorator.HostListener)
    )
    .map((member: IMember) => {
      const { identifier } = member;
      let eventName: string | undefined = '',
        args: string[] = [];
      const decorator = member.decorators.get(NgDirectiveClassMemberDecorator.HostListener);
      if (decorator) {
        eventName = getHostListenerMemberEventName(decorator);
        args = getHostListenerMemberArgs(decorator);
      }
      return {
        identifier,
        in: member.in,
        eventName,
        args,
      } as IHostListenerMemberMetadata;
    });
};

const getHostListenerMemberEventName = (decorator: ts.Decorator): string | undefined => {
  return getArgumentAtPositionAsString(decorator, 0);
};

const getHostListenerMemberArgs = (decorator: ts.Decorator): string[] => {
  return getArgumentAtPositionAsArrayOfStrings(decorator, 1);
};

const getHostPropertyName = (decorator: ts.Decorator): string | undefined => {
  return getArgumentAtPositionAsString(decorator, 0);
};

// This is identical to collectInputMemberMetadata...simplify!
// TODO (ryan): Refactor this to use a Generic + a function that captures
//   the arguments to the ts.CallExpression:
//   https://www.typescriptlang.org/docs/handbook/generics.html
const collectOutputMemberMetadata = (distribution: IMember[]): IOutputMemberMetadata[] => {
  return distribution
    .filter((member: IMember) => member.decorators.has(NgDirectiveClassMemberDecorator.Output))
    .map((member: IMember) => {
      const { identifier } = member;
      let bindingPropertyName;
      const decorator = member.decorators.get(NgDirectiveClassMemberDecorator.Output);
      if (decorator) {
        bindingPropertyName = getBindingPropertyName(decorator);
      }
      return {
        identifier,
        in: member.in,
        bindingPropertyName,
      } as IOutputMemberMetadata;
    });
};

const collectContentChildMemberMetadata = (
  distribution: IMember[]
): IContentChildMemberMetadata[] => {
  return distribution
    .filter((member: IMember) =>
      member.decorators.has(NgDirectiveClassMemberDecorator.ContentChild)
    )
    .map((member: IMember) => {
      const { identifier } = member;
      const decorator = member.decorators.get(NgDirectiveClassMemberDecorator.ContentChild);
      let selector!: ExpressionMetadata;
      let read;
      let isStatic!: boolean | undefined;
      if (decorator) {
        const expression = decorator.expression as ts.CallExpression;
        const [selectorArg, optionsArg] = expression.arguments;
        selector = collectExpressionMetadata(selectorArg);

        if (optionsArg && ts.isObjectLiteralExpression(optionsArg)) {
          const optionsProperties = optionsArg.properties.map(
            (prop: ts.ObjectLiteralElementLike) => prop
          );

          // TODO (ryan): Make sure to add this for @Inputs as well!
          if (hasKey(optionsArg, ContentChildDecoratorOption.Static)) {
            isStatic = getPropertyAsBoolean(optionsProperties, ContentChildDecoratorOption.Static);
          }

          if (hasKey(optionsArg, ContentChildDecoratorOption.Read)) {
            const readProp = getPropertyAsExpression(
              optionsProperties,
              ContentChildDecoratorOption.Read
            );
            if (readProp) {
              read = collectExpressionMetadata(readProp);
            }
          }
        }
      }
      return {
        identifier,
        in: member.in,
        selector,
        read,
        isStatic,
      } as IContentChildMemberMetadata;
    });
};

const collectContentChildrenMemberMetadata = (
  distribution: IMember[]
): IContentChildrenMemberMetadata[] => {
  return distribution
    .filter((member: IMember) =>
      member.decorators.has(NgDirectiveClassMemberDecorator.ContentChildren)
    )
    .map((member: IMember) => {
      const { identifier } = member;
      const decorator = member.decorators.get(NgDirectiveClassMemberDecorator.ContentChildren);
      let selector!: ExpressionMetadata;
      let read;
      let descendants!: boolean | undefined;
      if (decorator) {
        const expression = decorator.expression as ts.CallExpression;
        const [selectorArg, optionsArg] = expression.arguments;
        selector = collectExpressionMetadata(selectorArg);

        if (optionsArg && ts.isObjectLiteralExpression(optionsArg)) {
          const optionsProperties = optionsArg.properties.map(
            (prop: ts.ObjectLiteralElementLike) => prop
          );

          if (hasKey(optionsArg, ContentChildrenDecoratorOption.Descendants)) {
            descendants = getPropertyAsBoolean(
              optionsProperties,
              ContentChildrenDecoratorOption.Descendants
            );
          }

          if (hasKey(optionsArg, ContentChildrenDecoratorOption.Read)) {
            const readProp = getPropertyAsExpression(
              optionsProperties,
              ContentChildrenDecoratorOption.Read
            );
            if (readProp) {
              read = collectExpressionMetadata(readProp);
            }
          }
        }
      }
      return {
        identifier,
        in: member.in,
        selector,
        descendants,
        read,
      } as IContentChildrenMemberMetadata;
    });
};
