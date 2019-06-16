import ts from 'typescript';

import { IHasFilepath, IHasIdentifier } from './base.interface';
import { DataType } from './base.metadata';

/** Arguments */
export interface ITypeArgument {
  type: DataType;
  typeArguments?: ITypeArgument[];
}

export interface IMethodParameter extends IHasIdentifier, ITypeArgument {}

export interface IReturn extends ITypeArgument {}

export interface IMethodBase {
  parameters: IMethodParameter[];
  returns: IReturn;
}

export interface IMethodMetadata extends IHasIdentifier, IMethodBase {}
export interface IFunctionMetadata extends IMethodMetadata {
  optional: boolean;
}

// TODO (ryan): Move the following into their respective interface files.

/** Classes */
export interface IClassMetadata extends IHasIdentifier, IHasFilepath {}

/** Components */
export interface IComponentMetadata extends IHasIdentifier, IHasFilepath {}

/** Directives */
export interface IDirectiveMetadata extends IHasIdentifier, IHasFilepath {}

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

/** Interfaces */
export interface IInterfacePropertyMetadata extends IHasIdentifier {
  optional: boolean;
  type: DataType | string;
  typeArguments?: ITypeArgument[];
}

export interface IInterfaceMetadata extends IHasIdentifier, IHasFilepath {
  functions: IFunctionMetadata[];
  methods: IMethodMetadata[];
  properties: IInterfacePropertyMetadata[];
}

/** Modules */
export interface INgModuleMetadata extends IHasIdentifier, IHasFilepath {
  identifier: string;
  filepath: string;
}

// Instead of RootTypes, we should call these declarations
// QUESTION (ryan): Should we be capturing exported functions/methods
//   that are not defined in an interface or a class?
export enum RootType {
  classes = 'classes',
  components = 'components',
  directives = 'directives',
  enums = 'enums',
  interfaces = 'interfaces',
  modules = 'modules',
}

export interface INgInterfaceMetadataRoot {
  classes?: IClassMetadata[];
  components?: IComponentMetadata[];
  directives?: IDirectiveMetadata[];
  enums?: IEnumMetadata[];
  interfaces?: IInterfaceMetadata[];
  modules?: INgModuleMetadata[];
}

export type RootMetadataType =
  | IClassMetadata
  | IComponentMetadata
  | IDirectiveMetadata
  | IEnumMetadata
  | IInterfaceMetadata
  | INgModuleMetadata;

export type RootCollectorCallbackType = (
  root: INgInterfaceMetadataRoot,
  type: RootType,
  metadata: RootMetadataType
) => void;

export const rootCollectorCallback = (
  root: INgInterfaceMetadataRoot,
  type: RootType,
  metadata: RootMetadataType
) => {
  if (!root.hasOwnProperty(type)) {
    root[type] = [];
  }

  if (root[type]) {
    const collection = root[type] as Array<RootMetadataType>;
    collection.push(metadata);
  }
};
