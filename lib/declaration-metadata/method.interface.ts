import { IHasIdentifier, IHasFilepath } from './base.interface';
import { ITypeComposition } from './type.interface';

export interface IMethodParameter extends IHasIdentifier, ITypeComposition {}
export interface IReturn extends ITypeComposition {}

export interface IMethodBase {
  parameters: IMethodParameter[];
  returns: IReturn;
}

export interface IMethodMetadata extends IHasIdentifier, IMethodBase {}
export interface IRootMethodMetadata extends IMethodMetadata, IHasFilepath {}
