import ts from 'typescript';
import { IHasFilepath, IHasIdentifier } from './base.interface';
import { IMethodBase } from './method.interface';
import { IType } from './type.interface';
import { MemberModifier } from './base.metadata';
import { NodeDecoratorMap } from '../utils/decorator.util';

export interface IHeritageMetadata {
  extendsDef?: IType;
  implementsDef?: IType[];
}
export interface IConstructorMetadata extends IMethodBase {
  injectedProperties: IPropertyMetadata[];
}

export interface IPropertyMetadata extends IHasIdentifier, IType {
  initializer?: IType;
  modifiers?: MemberModifier[];
}
export interface IFunctionMetadata extends IHasIdentifier, IMethodBase {}
export interface IMethodMetadata extends IHasIdentifier, IMethodBase {}
export interface IGetAccessorMetadata extends IHasIdentifier, IMethodBase {}
export interface ISetAccessorMetadata extends IHasIdentifier, IMethodBase {}

export enum ClassMetadataGroup {
  Constructor = 'constructorDef',
  Property = 'properties',
  Function = 'functions',
  Heritage = 'heritage',
  Method = 'methods',
  Getter = 'getters',
  Setter = 'setters',
}

export interface IInGroup {
  in: ClassMetadataGroup;
}

export type ClassMemberType =
  | ts.ConstructorDeclaration
  | ts.PropertyDeclaration
  | ts.MethodDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration;

export interface IMember extends IHasIdentifier, IInGroup {
  member: ClassMemberType;
  decorators: NodeDecoratorMap;
}

export interface IMemberDistribution {
  constructorNode?: ts.ConstructorDeclaration;
  properties: ts.PropertyDeclaration[];
  functions: ts.PropertyDeclaration[];
  methods: ts.MethodDeclaration[];
  getAccessors: ts.GetAccessorDeclaration[];
  setAccessors: ts.SetAccessorDeclaration[];
  unknownDistribution: string[];
}

export interface IClassMetadata extends IHasIdentifier, IHasFilepath {
  constructorDef?: IConstructorMetadata;
  properties: IPropertyMetadata[];
  functions: IFunctionMetadata[];
  heritage?: IHeritageMetadata;
  methods: IMethodMetadata[];
  getters: IGetAccessorMetadata[];
  setters: ISetAccessorMetadata[];
}
