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
} from './component.interface';
import {
  collectClassMetadata,
  getMemberDistributionWithIdentifiersAndGroups,
  IMember,
} from './class.metadata';
import * as decIdUtil from './../utils/decorator-identifier.util';
import * as idUtil from './../utils/identifier.util';
import {
  getArgumentAtPositionAsString,
  getArgumentAtPositionAsArrayOfStrings,
} from './../utils/call-expression.util';
import { ClassMetadataGroup, IClassMetadata } from './class.interface';
import { getDecoratorMap } from '../utils/decorator.util';
import { IMethodParameter } from './method.interface';

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
  const metadata = collectClassMetadata(node, filepath);
  const distribution = getMemberDistributionWithIdentifiersAndGroups(node);
  const constructorParameterMetadata = collectConstructorParameterMetadata(distribution, metadata);
  const inputMembers = collectInputMemberMetadata(distribution);
  const hostBindingMembers = collectHostBindingMemberMetadata(distribution);
  const hostListenerMembers = collectHostListenerMemberMetadata(distribution);
  const outputMembers = collectOutputMemberMetadata(distribution);
  const contentChildMembers = collectContentChildMemberMetadata(distribution);
  const contentChildrenMembers = collectContentChildrenMemberMetadata(distribution);

  // Continue building out component specific metadata

  return {
    ...metadata,
    ngTemplate: '',
    constructorParameterMetadata,
    inputMembers,
    hostBindingMembers,
    hostListenerMembers,
    outputMembers,
    contentChildMembers,
    contentChildrenMembers,
  };
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
      const attributeDecorator = paramDecoratorMap.get(decIdUtil.ATTRIBUTE);
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
    .filter((member: IMember) => member.decorators.has(decIdUtil.INPUT))
    .map(
      (member: IMember): IInputMemberMetadata => {
        const { identifier } = member;
        let bindingPropertyName = undefined;
        const decorator = member.decorators.get(decIdUtil.INPUT);
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
    .filter((member: IMember) => member.decorators.has(decIdUtil.HOST_BINDING))
    .map((member: IMember) => {
      const { identifier } = member;
      let hostPropertyName;
      const decorator = member.decorators.get(decIdUtil.HOST_BINDING);
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
    .filter((member: IMember) => member.decorators.has(decIdUtil.HOST_LISTENER))
    .map((member: IMember) => {
      const { identifier } = member;
      let eventName: string | undefined = '',
        args: string[] = [];
      const decorator = member.decorators.get(decIdUtil.HOST_LISTENER);
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
const collectOutputMemberMetadata = (distribution: IMember[]): IOutputMemberMetadata[] => {
  return distribution
    .filter((member: IMember) => member.decorators.has(decIdUtil.OUTPUT))
    .map((member: IMember) => {
      const { identifier } = member;
      let bindingPropertyName;
      const decorator = member.decorators.get(decIdUtil.OUTPUT);
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
    .filter((member: IMember) => member.decorators.has(decIdUtil.CONTENT_CHILD))
    .map((member: IMember) => {
      const { identifier } = member;
      const decorator = member.decorators.get(decIdUtil.CONTENT_CHILD);
      if (decorator) {
        // Get decorator metadata here.
        // Like this...
        //   bindingPropertyName = getBindingPropertyName(decorator);
      }
      return {
        identifier,
        in: member.in,
      } as IContentChildMemberMetadata;
    });
};

const collectContentChildrenMemberMetadata = (
  distribution: IMember[]
): IContentChildMemberMetadata[] => {
  return distribution
    .filter((member: IMember) => member.decorators.has(decIdUtil.CONTENT_CHILDREN))
    .map((member: IMember) => {
      const { identifier } = member;
      const decorator = member.decorators.get(decIdUtil.CONTENT_CHILDREN);
      if (decorator) {
        // Get decorator metadata here.
        // Like this...
        //   bindingPropertyName = getBindingPropertyName(decorator);
      }
      return {
        identifier,
        in: member.in,
      } as IContentChildMemberMetadata;
    });
};
