import ts from 'typescript';
import * as idUtil from './../utils/identifier.util';
import { EnumMemberType, EnumMemberMetadataType, IEnumMetadata } from './enum.interface';

export const collectEnumMetadata = (node: ts.EnumDeclaration, filepath: string): IEnumMetadata => {
  const identifier = idUtil.getName(node as idUtil.NameableProxy);
  const members = node.members.map((member: ts.EnumMember, index) => {
    const memberId = idUtil.getName(member as idUtil.NameableProxy);
    let value: number | string = index;
    let type = EnumMemberType.Number;
    if (member.initializer) {
      if (ts.isNumericLiteral(member.initializer)) {
        value = parseInt(member.initializer.getText(), 10);
      } else if (ts.isStringLiteral(member.initializer)) {
        type = EnumMemberType.String;
        value = member.initializer.text;
      }
    }

    return {
      identifier: memberId,
      type,
      value,
    };
  }) as EnumMemberMetadataType[];

  return {
    filepath,
    identifier,
    members,
  } as IEnumMetadata;
};
