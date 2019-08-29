import ts from 'typescript';
import {
  IAngularCoreClassMemberMetadata,
  IInputMemberMetadata,
  IHostBindingMemberMetadata,
  IHostListenerMemberMetadata,
  IOutputMemberMetadata,
  IContentChildMemberMetadata,
  ContentChildDecoratorOption,
  IContentChildrenMemberMetadata,
  ContentChildrenDecoratorOption,
  IViewChildMemberMetadata,
  IViewChildrenMemberMetadata,
  ViewChildDecoratorOption,
  ViewChildrenDecoratorOption,
} from './angular-core.interface';
import { IMember, IClassMetadata, ClassMetadataGroup } from './class.interface';
import {
  NgDirectiveClassMemberDecorator,
  NgComponentClassMemberDecorator,
} from './../utils/decorator-identifier.util';
import {
  getArgumentAtPositionAsString,
  getArgumentAtPositionAsArrayOfStrings,
} from './../utils/call-expression.util';
import { ExpressionMetadata } from './expression.interface';
import { collectExpressionMetadata } from './expression.metadata';
import * as idUtil from './../utils/identifier.util';
import {
  hasKey,
  getPropertyAsBoolean,
  getPropertyAsExpression,
} from '../utils/object-literal-expression.util';
import {
  IConstructorParameterMetadata,
  IConstructorParameterAttribute,
  ConstructorParameterRefType,
  IConstructorParameterRefMetadata,
} from './angular-core.interface';
import { IMethodParameter } from './method.interface';
import { getDecoratorMap } from '../utils/decorator.util';

/**
 * Metadata collection for decorators in @angular/core
 */

export const collectAngularCoreClassMemberMetadata = (
  distribution: IMember[]
): IAngularCoreClassMemberMetadata => {
  const inputMembers = collectInputMemberMetadata(distribution);
  const hostBindingMembers = collectHostBindingMemberMetadata(distribution);
  const hostListenerMembers = collectHostListenerMemberMetadata(distribution);
  const outputMembers = collectOutputMemberMetadata(distribution);
  const contentChildMembers = collectContentChildMemberMetadata(distribution);
  const contentChildrenMembers = collectContentChildrenMemberMetadata(distribution);
  const viewChildMembers = collectViewChildMemberMetadata(distribution);
  const viewChildrenMembers = collectViewChildrenMemberMetadata(distribution);

  return {
    inputMembers,
    hostBindingMembers,
    hostListenerMembers,
    outputMembers,
    contentChildMembers,
    contentChildrenMembers,
    viewChildMembers,
    viewChildrenMembers,
  };
};

export const collectConstructorParameterMetadata = (
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

// TODO (ryan): Finish this up!
// NOTE (ryan): ViewChild and ContentChild share the same decorator interface
//   and properties. Extract the decorator code out to another function.
const collectViewChildMemberMetadata = (
  distribution: IMember[]
): IViewChildMemberMetadata[] | undefined => {
  const members = distribution.filter((member: IMember) =>
    member.decorators.has(NgComponentClassMemberDecorator.ViewChild)
  );
  if (members.length > 0) {
    return members.map((member: IMember) => {
      const { identifier } = member;
      const decorator: ts.Decorator | undefined = member.decorators.get(
        NgComponentClassMemberDecorator.ViewChild
      );

      let selector!: ExpressionMetadata;
      let isStatic!: boolean | undefined;
      let read!: ExpressionMetadata | undefined;

      if (decorator) {
        const expression = decorator.expression as ts.CallExpression;
        const [selectorArg, optionsArg] = expression.arguments;
        selector = collectExpressionMetadata(selectorArg);

        if (optionsArg && ts.isObjectLiteralExpression(optionsArg)) {
          const optionsProperties = optionsArg.properties.map(
            (prop: ts.ObjectLiteralElementLike) => prop
          );

          if (hasKey(optionsArg, ViewChildDecoratorOption.Static)) {
            isStatic = getPropertyAsBoolean(optionsProperties, ViewChildDecoratorOption.Static);
          }

          if (hasKey(optionsArg, ViewChildDecoratorOption.Read)) {
            const readProp = getPropertyAsExpression(
              optionsProperties,
              ViewChildDecoratorOption.Read
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
        isStatic,
        read,
      } as IViewChildMemberMetadata;
    });
  }

  return;
};

// TODO (ryan): Finish this up!!!
// NOTE (ryan): ViewChildren shares some interface aspects with ContentChildren
//   Is there a way to share code between them?
const collectViewChildrenMemberMetadata = (
  distribution: IMember[]
): IViewChildrenMemberMetadata[] | undefined => {
  const members = distribution.filter((member: IMember) =>
    member.decorators.has(NgComponentClassMemberDecorator.ViewChildren)
  );
  if (members.length > 0) {
    return members.map((member: IMember) => {
      const { identifier } = member;
      const decorator: ts.Decorator | undefined = member.decorators.get(
        NgComponentClassMemberDecorator.ViewChildren
      );
      let raw = '';
      let selector!: ExpressionMetadata;
      let read!: ExpressionMetadata | undefined;

      if (decorator) {
        raw = decorator.getText();
        const expression = decorator.expression as ts.CallExpression;
        const [selectorArg, optionsArg] = expression.arguments;
        selector = collectExpressionMetadata(selectorArg);

        if (optionsArg && ts.isObjectLiteralExpression(optionsArg)) {
          const optionsProperties = optionsArg.properties.map(
            (prop: ts.ObjectLiteralElementLike) => prop
          );

          if (hasKey(optionsArg, ViewChildrenDecoratorOption.Read)) {
            const readProp = getPropertyAsExpression(
              optionsProperties,
              ViewChildrenDecoratorOption.Read
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
        read,
        selector,
      } as IViewChildrenMemberMetadata;
    });
  }

  return;
};
