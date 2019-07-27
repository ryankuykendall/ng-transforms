import { IClassMetadata } from './class.interface';

export interface IDirectiveClassDecoratorMetadata {
  selector: string;
  hostElementBindings: string[];
  inputs: string[];
  outputs: string[];
  providers: string[];
  queries: string[];
  exportAs?: string;
}

export interface IDirectiveMetadata extends IClassMetadata, IDirectiveClassDecoratorMetadata {
  ngTemplate: string;
}
