import { IClassMetadata } from './class.interface';
import { IComponentMetadata } from './component.interface';
import { IDirectiveMetadata } from './directive.interface';
import { IEnumMetadata } from './enum.interface';
import { IInterfaceMetadata } from './interface.interface';
import { IRootMethodMetadata } from './method.interface';
import { INgModuleMetadata } from './ng-module.interface';
import { ITypeAliasMetadata } from './type-aliases.interface';
import { IRootFunctionMetadata } from './function.interface';
import { ISourceFileMetadata } from './source-file.interface';
import { IInjectableMetadata } from './injectable.interface';
import { IPipeMetadata } from './pipe.interface';

// Instead of RootTypes, we should call these declarations
// QUESTION (ryan): Should we be capturing exported functions/methods
//   that are not defined in an interface or a class?
export enum RootType {
  Classes = 'classes',
  Components = 'components',
  Directives = 'directives',
  Enums = 'enums',
  Functions = 'functions',
  Injectables = 'injectables',
  Interfaces = 'interfaces',
  Methods = 'methods',
  NgModules = 'ngModules',
  Pipes = 'pipes',
  SourceFiles = 'sourceFiles',
  TypeAliases = 'typeAliases',
}

export type RootCollectorCallbackType = (
  root: IRootMetadata,
  type: RootType,
  metadata: RootMetadataType
) => void;

type indexableRoot = { [key: string]: Array<RootMetadataType> };

export interface IRootMetadata extends indexableRoot {
  sourceFiles: ISourceFileMetadata[];
  classes: IClassMetadata[];
  components: IComponentMetadata[];
  directives: IDirectiveMetadata[];
  enums: IEnumMetadata[];
  functions: IRootFunctionMetadata[]; // TODO (ryan)!
  injectables: IInjectableMetadata[];
  interfaces: IInterfaceMetadata[];
  methods: IRootMethodMetadata[]; // TODO (ryan)!
  ngModules: INgModuleMetadata[];
  typeAliases: ITypeAliasMetadata[];
}

export type RootMetadataType =
  | ISourceFileMetadata
  | IClassMetadata
  | IComponentMetadata
  | IDirectiveMetadata
  | IEnumMetadata
  | IRootFunctionMetadata
  | IInjectableMetadata
  | IInterfaceMetadata
  | IRootMethodMetadata
  | INgModuleMetadata
  | IPipeMetadata
  | ITypeAliasMetadata;
