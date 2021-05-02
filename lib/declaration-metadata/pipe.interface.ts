import { IClassMetadata } from './class.interface';

export interface IPipeClassDecoratorMetadata {
  name?: string;
  pure?: boolean;
}

export interface IPipeMetadata extends IClassMetadata, IPipeClassDecoratorMetadata {}