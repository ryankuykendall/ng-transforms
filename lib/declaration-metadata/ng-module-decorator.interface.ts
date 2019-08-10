import { ExpressionMetadata } from './expression.interface';

export interface IHasExpression {
  expression: ExpressionMetadata;
}

export interface IBootstrapMetadata extends IHasExpression {}
export interface IDeclarationsMetadata extends IHasExpression {}
export interface IEntryComponentsMetadata extends IHasExpression {}
export interface IExportsMetadata extends IHasExpression {}
export interface IImportsMetadata extends IHasExpression {}
export interface IProvidersMetadata extends IHasExpression {}
export interface ISchemasMetadata extends IHasExpression {}
