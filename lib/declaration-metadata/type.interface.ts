// import {} './base.interface';
import { DataType, TypeGroup } from './base.metadata';

/** Arguments */
export interface ITypeArgument {
  type: DataType;
  typeArguments?: ITypeArgument[];
}

// ***** FINISH THIS *****
// This is a collection to support unions (supports 1 or many)
export interface ITypeGroup {
  typeGroup: TypeGroup;
}

export type IHeterogeneousType = ITypeComposition | ITypeArgument[];

export interface ITypes {
  types: IHeterogeneousType[];
}

export interface ITypeComposition extends ITypeGroup, ITypes {}
