import { DataType } from './base.metadata';
import { ExpressionMetadata } from './expression.interface';

export interface IType {
  type: DataType;
  args?: IType[];
  members?: ITypeMember[];
  literal?: number | boolean | string;
}

export interface ITypeMember {
  key?: ExpressionMetadata;
  value?: ExpressionMetadata;
}
