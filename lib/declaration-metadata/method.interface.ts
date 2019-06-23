import { IHasIdentifier, IHasFilepath } from './base.interface';
import { IType } from './type.interface';

export interface IMethodParameter extends IHasIdentifier {}
export interface IReturn extends IType {}

export interface IMethodBase {
  parameters: IMethodParameter[];
  returns: IReturn;
}

export interface IMethodMetadata extends IHasIdentifier, IMethodBase {}
export interface IRootMethodMetadata extends IMethodMetadata, IHasFilepath {}
