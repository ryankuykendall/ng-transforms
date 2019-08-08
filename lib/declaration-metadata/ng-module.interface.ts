import { IClassMetadata } from './class.interface';
import {
  IImportMetadata,
  IExportMetadata,
  IProviderMetadata,
  IEntryComponentsMetadata,
} from './ng-module-decorator.interface';

export interface INgModuleClassDecoratorMetadata {
  id?: string;
  bootstrap?: string;
  declarations?: string;
  entryComponents?: IEntryComponentsMetadata;
  exports?: IExportMetadata;
  imports?: IImportMetadata;
  providers?: IProviderMetadata;
  schemas?: string;
}
export interface INgModuleMetadata extends IClassMetadata, INgModuleClassDecoratorMetadata {}
