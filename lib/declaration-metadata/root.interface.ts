import { IClassMetadata } from './class.interface';
import { IComponentMetadata } from './component.interface';
import { IDirectiveMetadata } from './directive.interface';
import { IEnumMetadata } from './enum.interface';
import { IInterfaceMetadata } from './interface.interface';
import { IRootMethodMetadata } from './method.interface';
import { INgModuleMetadata } from './ng-module.interface';
import { ITypeAliasMetadata } from './type-aliases.interface';
import { IRootFunctionMetadata } from './function.interface';

// Instead of RootTypes, we should call these declarations
// QUESTION (ryan): Should we be capturing exported functions/methods
//   that are not defined in an interface or a class?
export enum RootType {
  Classes = 'classes',
  Components = 'components',
  Directives = 'directives',
  Enums = 'enums',
  Functions = 'functions',
  Interfaces = 'interfaces',
  Methods = 'methods',
  Modules = 'modules',
  TypeAliases = 'typeAliases',
}

export type RootCollectorCallbackType = (
  root: IRootMetadata,
  type: RootType,
  metadata: RootMetadataType
) => void;

type indexableRoot = { [key: string]: Array<RootMetadataType> };

export interface IRootMetadata extends indexableRoot {
  classes: IClassMetadata[];
  components: IComponentMetadata[];
  directives: IDirectiveMetadata[];
  enums: IEnumMetadata[];
  functions: IRootFunctionMetadata[]; // TODO (ryan)!
  interfaces: IInterfaceMetadata[];
  methods: IRootMethodMetadata[]; // TODO (ryan)!
  modules: INgModuleMetadata[];
  typeAliases: ITypeAliasMetadata[];
}

export type RootMetadataType =
  | IClassMetadata
  | IComponentMetadata
  | IDirectiveMetadata
  | IEnumMetadata
  | IRootFunctionMetadata
  | IInterfaceMetadata
  | IRootMethodMetadata
  | INgModuleMetadata
  | ITypeAliasMetadata;
