import { IHasFilepath, IHasIdentifier } from './base.interface';
import { ITypeComposition } from './type.interface';

export interface ITypeAliasMetadata extends IHasIdentifier, IHasFilepath, ITypeComposition {}
