import { IHasFilepath, IHasIdentifier } from './base.interface';
import { IMethodBase } from './interface.interface';

export interface IConstructorMetadata extends IMethodBase {}
export interface IPropertyMetadata extends IHasIdentifier {}
export interface IFunctionMetadata extends IHasIdentifier, IMethodBase {}
export interface IMethodMetadata extends IHasIdentifier, IMethodBase {}
export interface IGetAccessorMetadata extends IHasIdentifier, IMethodBase {}
export interface ISetAccessorMetadata extends IHasIdentifier, IMethodBase {}

export interface IClassMetadata extends IHasIdentifier, IHasFilepath {
  constructorDef?: IConstructorMetadata;
  properties: IPropertyMetadata[];
  functions: IFunctionMetadata[];
  methods: IMethodMetadata[];
  getters: IGetAccessorMetadata[];
  setters: ISetAccessorMetadata[];
}
