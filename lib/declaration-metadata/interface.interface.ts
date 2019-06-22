import { IHasFilepath, IHasIdentifier, IOptional } from './base.interface';
import { IFunctionMetadata } from './function.interface';
import { IMethodMetadata } from './method.interface';
import { ITypeComposition } from './type.interface';

/** Interfaces */
export interface IInterfacePropertyMetadata extends IHasIdentifier, ITypeComposition, IOptional {}

export interface IInterfaceMetadata extends IHasIdentifier, IHasFilepath {
  functions: IFunctionMetadata[];
  methods: IMethodMetadata[];
  properties: IInterfacePropertyMetadata[];
}
