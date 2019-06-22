import { IHasIdentifier, IHasFilepath, IOptional } from './base.interface';
import { IMethodMetadata } from './method.interface';

// QUESTION (ryan): How to make a distinction between functions at file root
//   vs. functions defined in interfaces and classes?
export interface IFunctionMetadata extends IMethodMetadata, IOptional {}
export interface IRootFunctionMetadata extends IFunctionMetadata, IHasIdentifier, IHasFilepath {}
// QUESTION (ryan): Consider IInterfaceFunctionMetadata and IClassFunctionMetadata?
