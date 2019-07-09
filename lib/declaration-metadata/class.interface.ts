import { IHasFilepath, IHasIdentifier } from './base.interface';
import { IMethodBase } from './method.interface';
import { IType } from './type.interface';
import { MemberModifier } from './base.metadata';

export interface IHeritageMetadata {
  extendsDef?: IType;
  implementsDef?: IType[];
}
export interface IConstructorMetadata extends IMethodBase {
  injectedProperties: IPropertyMetadata[];
}

export interface IPropertyMetadata extends IHasIdentifier, IType {
  initializer?: IType;
  modifiers?: MemberModifier[];
}
export interface IFunctionMetadata extends IHasIdentifier, IMethodBase {}
export interface IMethodMetadata extends IHasIdentifier, IMethodBase {}
export interface IGetAccessorMetadata extends IHasIdentifier, IMethodBase {}
export interface ISetAccessorMetadata extends IHasIdentifier, IMethodBase {}

export enum ClassMetadataGroup {
  Constructor = 'constructorDef',
  Property = 'properties',
  Function = 'functions',
  Heritage = 'heritage',
  Method = 'methods',
  Getter = 'getters',
  Setter = 'setters',
}

export interface IInGroup {
  in: ClassMetadataGroup;
}

export interface IClassMetadata extends IHasIdentifier, IHasFilepath {
  constructorDef?: IConstructorMetadata;
  properties: IPropertyMetadata[];
  functions: IFunctionMetadata[];
  heritage?: IHeritageMetadata;
  methods: IMethodMetadata[];
  getters: IGetAccessorMetadata[];
  setters: ISetAccessorMetadata[];
}
