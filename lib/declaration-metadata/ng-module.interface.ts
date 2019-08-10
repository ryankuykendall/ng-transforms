import { IClassMetadata } from './class.interface';
import {
  IImportsMetadata,
  IExportsMetadata,
  IProvidersMetadata,
  IEntryComponentsMetadata,
  IBootstrapMetadata,
  IDeclarationsMetadata,
  ISchemasMetadata,
} from './ng-module-decorator.interface';

export interface INgModuleClassDecoratorMetadata {
  id?: string;
  bootstrap?: IBootstrapMetadata;
  declarations?: IDeclarationsMetadata;
  entryComponents?: IEntryComponentsMetadata;
  exports?: IExportsMetadata;
  imports?: IImportsMetadata;
  providers?: IProvidersMetadata;
  schemas?: ISchemasMetadata;
}
export interface INgModuleMetadata extends IClassMetadata, INgModuleClassDecoratorMetadata {}
