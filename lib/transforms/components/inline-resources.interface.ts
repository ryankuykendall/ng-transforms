import ts from 'typescript';

// CLEANUP (ryan): Create shorthand versions of these since they are
//   namespaced: IRef, IModel, IBuild, IBundle
export interface IComponentDecoratorRef {
  // File system
  filepath: string;
  dirname: string;

  // AST Nodes
  sourceFile: ts.SourceFile;
  decorator: ts.Decorator;
}

export interface IComponentInlineModel extends IComponentDecoratorRef {
  // File system
  relativeDirname: string;

  // AST Nodes
  callExpression: ts.CallExpression;
  objectLiteralExpression: ts.ObjectLiteralExpression;

  // Assets
  template?: string;
  hasTemplateUrl: boolean; // Present to determine if we need to prune this property after transform.
  templateUrl?: string;
  styles?: string[];
  hasStyleUrls: boolean; // Present to determine if we need to prune this property after transform.
  styleUrls?: string[]; // Need this to preserve order as well as the needing the map!
  styleUrlsMap?: Map<string, string>;
}

export interface IComponentInlineBuild extends IComponentInlineModel {
  buildDirname?: string;
}

export interface IComponentInlineTransformBundle {
  sourceFile: ts.SourceFile;
  models: IComponentInlineModel[];
  transformOutput?: string;
}
