import ts from 'typescript';
import { IHasFilepath, IHasIdentifier } from './base.interface';

export interface IGetAccessorMetadata extends IHasIdentifier {}
export interface ISetAccessorMetadata extends IHasIdentifier {}

export interface IClassMetadata extends IHasIdentifier, IHasFilepath {
  getters: IGetAccessorMetadata[];
  setters: ISetAccessorMetadata[];
}
