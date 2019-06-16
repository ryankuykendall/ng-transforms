import { IClassMetadata } from './class.interface';
import { IComponentMetadata } from './component.interface';
import { IDirectiveMetadata } from './directive.interface';
import { IEnumMetadata } from './enum.interface';
import { IInterfaceMetadata } from './interface.interface';
import { INgModuleMetadata } from './ng-module.interface';

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

export type RootCollectorCallbackType = (
  root: IRootMetadata,
  type: RootType,
  metadata: RootMetadataType
) => void;

export interface IRootMetadata {
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
