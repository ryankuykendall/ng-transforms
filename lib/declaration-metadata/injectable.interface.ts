import { IClassMetadata } from './class.interface';
import { ExpressionMetadata } from './expression.interface';

export interface IProvidedInMetadata {
  root: boolean;
  expression?: ExpressionMetadata;
}

export interface IInjectableClassDecoratorMetadata {
  providedIn?: IProvidedInMetadata;
}

export interface IInjectableMetadata extends IClassMetadata, IInjectableClassDecoratorMetadata {}
