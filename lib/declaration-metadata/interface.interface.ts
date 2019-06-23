import { IHasFilepath, IHasIdentifier, IOptional } from './base.interface';
import { IFunctionMetadata } from './function.interface';
import { IMethodMetadata } from './method.interface';

/** Interfaces */
export interface IInterfacePropertyMetadata extends IHasIdentifier, IOptional {}

export interface IInterfaceMetadata extends IHasIdentifier, IHasFilepath {
  functions: IFunctionMetadata[];
  methods: IMethodMetadata[];
  properties: IInterfacePropertyMetadata[];
}
