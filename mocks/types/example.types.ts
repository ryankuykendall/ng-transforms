export type UnaryLike = boolean;
export type UnionLike = number | boolean;
export type IntersectionLike = number & boolean;
export type Hybrid = number & boolean | undefined;
export type HybridWithPrecedence = (number & boolean) | undefined;
export type HybridWithPrecedenceAndTypeArguments =
  | (Map<number | string, string> | Set<number & boolean>)
  | null;
// export type FunctionLike = function(Map<string, boolean>, Set<number>): number;
export type ArrowFunctionLike = (first: number, second: boolean) => number | boolean;
