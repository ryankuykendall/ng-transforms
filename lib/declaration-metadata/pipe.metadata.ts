import ts from "typescript";
import { NgClassDecorator } from "../utils/decorator-identifier.util";
import { getDecoratorMap } from "../utils/decorator.util";
import { collectClassMetadata } from "./class.metadata";
import { collectPipeClassDecoratorMetadata } from "./pipe-decorator.metadata";
import { IPipeMetadata, IPipeClassDecoratorMetadata } from "./pipe.interface";

export const collectPipeMetadata = (node: ts.ClassDeclaration, filepath: string): IPipeMetadata => {
  const classMetadata = collectClassMetadata(node, filepath);
  const classDecoratorMap = getDecoratorMap(node);
  const decorator = classDecoratorMap.get(NgClassDecorator.Pipe);
  const pipeDecoratorMetadata:
    | IPipeClassDecoratorMetadata
    | undefined = collectPipeClassDecoratorMetadata(decorator);

  return {
    ...pipeDecoratorMetadata,
    ...classMetadata,
  };
};