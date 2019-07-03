import ts from 'typescript';
import {
  IComponentMetadata,
  IInputMemberMetadata,
  IHostBindingMemberMetadata,
  IOutputMemberMetadata,
} from './component.interface';
import {
  collectClassMetadata,
  getMemberDistributionWithIdentifiersAndGroups,
  IMember,
} from './class.metadata';
import * as decUtil from './../utils/decorator-identifier.util';
import { getArgumentsAsStrings } from '../utils/call-expression.util';

export const collectComponentMetadata = (
  node: ts.ClassDeclaration,
  filepath: string
): IComponentMetadata => {
  const metadata = collectClassMetadata(node, filepath);
  const distribution = getMemberDistributionWithIdentifiersAndGroups(node);
  const inputMembers = collectInputMemberMetadata(distribution);
  const hostBindingMembers = collectHostBindingMemberMetadata(distribution);
  const hostListenerMembers: IHostBindingMemberMetadata[] = [];
  const outputMembers = collectOutputMemberMetadata(distribution);
  // Continue building out component specific metadata

  return {
    ...metadata,
    bootstrappingTemplate: '',
    inputMembers,
    hostBindingMembers,
    hostListenerMembers,
    outputMembers,
  };
};

const collectInputMemberMetadata = (distribution: IMember[]): IInputMemberMetadata[] => {
  return distribution
    .filter((member: IMember) => member.decorators.has(decUtil.INPUT))
    .map(
      (member: IMember): IInputMemberMetadata => {
        const { identifier } = member;
        let bindingPropertyName = undefined;
        const decorator = member.decorators.get(decUtil.INPUT);
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
  const args = getArgumentsAsStrings(decorator);
  if (args.length > 0) return args[0];
  return;
};

const collectHostBindingMemberMetadata = (
  distribution: IMember[]
): IHostBindingMemberMetadata[] => {
  return distribution
    .filter((member: IMember) => member.decorators.has(decUtil.HOST_BINDING))
    .map((member: IMember) => {
      const { identifier } = member;
      let hostPropertyName;
      const decorator = member.decorators.get(decUtil.HOST_BINDING);
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

const getHostPropertyName = (decorator: ts.Decorator): string | undefined => {
  const args = getArgumentsAsStrings(decorator);
  if (args.length > 0) return args[0];
  return;
};

// This is identical to collectInputMemberMetadata...simplify!
const collectOutputMemberMetadata = (distribution: IMember[]): IOutputMemberMetadata[] => {
  return distribution
    .filter((member: IMember) => member.decorators.has(decUtil.OUTPUT))
    .map((member: IMember) => {
      const { identifier } = member;
      let bindingPropertyName;
      const decorator = member.decorators.get(decUtil.OUTPUT);
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
