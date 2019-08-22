import { IClassMetadata } from './class.interface';
import { IType } from './type.interface';

export interface IServiceMetadata extends IClassMetadata {
  // TODO (ryan): This should follow the same pattern used in NgModule (IHasExpression)
  providedIn?: IType;
}
