import { IHasFilepath, IHasIdentifier } from './base.interface';
import { DataType } from './base.metadata';

/** Arguments */
export interface ITypeArgument {
  type: DataType;
  typeArguments?: ITypeArgument[];
}

export interface IMethodParameter extends IHasIdentifier, ITypeArgument {}

export interface IReturn extends ITypeArgument {}

export interface IMethodBase {
  parameters: IMethodParameter[];
  returns: IReturn;
}

export interface IMethodMetadata extends IHasIdentifier, IMethodBase {}
export interface IFunctionMetadata extends IMethodMetadata {
  optional: boolean;
}

/** Interfaces */
export interface IInterfacePropertyMetadata extends IHasIdentifier {
  optional: boolean;
  type: DataType | string;
  typeArguments?: ITypeArgument[];
}

export interface IInterfaceMetadata extends IHasIdentifier, IHasFilepath {
  functions: IFunctionMetadata[];
  methods: IMethodMetadata[];
  properties: IInterfacePropertyMetadata[];
}
