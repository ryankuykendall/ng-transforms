import { IHasIdentifier } from './base.interface';

export enum ModuleResolution {
  RelativeFilepath = 'relative-filepath',
  NodeModules = 'node_modules',
}

export interface INamedBinding extends IHasIdentifier {
  // Original property name from imported module (e.g., { propertyName as name })
  propertyIdentifier?: string;
}

export interface INamespaceBinding extends IHasIdentifier {}
export interface INamespaceImport extends IHasIdentifier {}

export interface IImportDeclarationMetadata {
  moduleSpecifier: string;
  moduleResolution: ModuleResolution;
  filepath?: string;
  nodeModule?: string;
  namedBindings: INamedBinding[];
  namespaceBinding?: INamespaceBinding;
  namespaceImport?: INamespaceImport;
}
