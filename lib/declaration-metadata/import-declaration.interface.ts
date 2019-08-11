export enum ModuleResolution {
  RelativeFilepath = 'relative-filepath',
  NodeModules = 'node_modules',
}

export interface IImportDeclarationMetadata {
  raw: string;
  moduleSpecifier: string;
  moduleResolution: ModuleResolution;
  filepath?: string;
  nodeModule?: string;
}
