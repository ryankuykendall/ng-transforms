import { IHasFilepath, IHasIdentifier } from './base.interface';

/** Enums */
export enum EnumMemberType {
  Number = 'number',
  String = 'string',
}

export interface IEnumNumberMemberMetadata extends IHasIdentifier {
  type: EnumMemberType;
  value: string;
}

export interface IEnumStringMemberMetadata extends IHasIdentifier {
  type: EnumMemberType;
  value: string;
}

export type EnumMemberMetadataType = IEnumNumberMemberMetadata | IEnumStringMemberMetadata;

export interface IEnumMetadata extends IHasIdentifier, IHasFilepath {
  members: (IEnumNumberMemberMetadata | IEnumStringMemberMetadata)[];
}
