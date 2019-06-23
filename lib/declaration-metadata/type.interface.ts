import { DataType } from './base.metadata';

export interface IType {
  type: DataType;
  args?: IType[];
}
