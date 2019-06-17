import ts from 'typescript';
import { IHasFilepath, IHasIdentifier } from './base.interface';

export interface IFunctionMetadata extends IHasIdentifier {}
export interface IMethodMetadata extends IHasIdentifier {}
export interface IGetAccessorMetadata extends IHasIdentifier {}
export interface ISetAccessorMetadata extends IHasIdentifier {}

export interface IClassMetadata extends IHasIdentifier, IHasFilepath {
  functions: IFunctionMetadata[];
  methods: IMethodMetadata[];
  getters: IGetAccessorMetadata[];
  setters: ISetAccessorMetadata[];
}
