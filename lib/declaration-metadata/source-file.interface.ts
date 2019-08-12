import { IHasFilepath, IHasIdentifier } from './base.interface';
import { IImportDeclarationMetadata } from './import-declaration.interface';
import { IType } from './type.interface';
import { StatementType } from './base.metadata';

// QUESTION (ryan): Do we need identifier as well as type? Could we get away with
//   just the IType?
export interface IExportStatement extends IHasIdentifier {
  exportType: StatementType | string;
  raw?: string;
}

export interface ISourceFileMetadata extends IHasFilepath {
  importDeclarations: IImportDeclarationMetadata[];
  exportStatements: IExportStatement[];
}
