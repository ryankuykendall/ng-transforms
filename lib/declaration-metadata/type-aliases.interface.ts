import { IHasFilepath, IHasIdentifier } from './base.interface';
import { IType } from './type.interface';

export interface ITypeAliasMetadata extends IHasIdentifier, IHasFilepath, IType {}
