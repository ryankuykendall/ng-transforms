import { IHasFilepath } from './base.interface';
import { IImportDeclarationMetadata } from './import-declaration.interface';

export interface ISourceFileMetadata extends IHasFilepath {
  importDeclarations: IImportDeclarationMetadata[];
}
