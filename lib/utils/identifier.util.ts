import ts from 'typescript';

export interface NameableProxy {
  name: ts.Identifier;
}

export const getName = (declaration: NameableProxy): string => {
  return declaration.name.escapedText as string;
};
