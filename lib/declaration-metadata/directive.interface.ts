import { IClassMetadata } from './class.interface';
import * as CSSWhat from 'css-what';

export interface ISelectorSet {
  raw: string;
  selectors: CSSWhat.Selector[][];
}

export interface IDirectiveClassDecoratorMetadata {
  selector: ISelectorSet;
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
