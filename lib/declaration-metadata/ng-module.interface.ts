import { IClassMetadata } from './class.interface';
import { IImportMetadata, IExportMetadata } from './ng-module-decorator.interface';

export interface INgModuleClassDecoratorMetadata {
  id?: string;
  bootstrap?: string;
  declarations?: string;
  entryComponents?: string;
  exports?: IExportMetadata;
  imports?: IImportMetadata;
  providers?: string;
  schemas?: string;
}
export interface INgModuleMetadata extends IClassMetadata, INgModuleClassDecoratorMetadata {}
