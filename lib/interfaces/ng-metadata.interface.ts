import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript';

interface IMetadataBase {
  identifier: string;
  filepath: string;
}

export interface IClassMetadata {
  identifier: string;
  filepath: string;
}

export interface IComponentMetadata {
  identifier: string;
  filepath: string;
}

export interface IDirectiveMetadata {
  identifier: string;
  filepath: string;
}

export interface IEnumMetadata {
  identifier: string;
  filepath: string;
}

export interface IInterfaceMetadata {
  identifier: string;
  filepath: string;
}

export interface INgModuleMetadata {
  identifier: string;
  filepath: string;
}

// Instead of RootTypes, we should call these declarations
export enum RootType {
  classes = 'classes',
  components = 'components',
  directives = 'directives',
  enums = 'enums',
  interfaces = 'interfaces',
  modules = 'modules',
}

export interface INgInterfaceMetaDataRoot {
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
  root: INgInterfaceMetaDataRoot,
  type: RootType,
  metadata: RootMetadataType
) => void;

export const rootCollectorCallback = (
  root: INgInterfaceMetaDataRoot,
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
