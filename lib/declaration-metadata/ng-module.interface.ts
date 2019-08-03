import { IClassMetadata } from './class.interface';

export interface INgModuleClassDecoratorMetadata {
  id?: string;
  bootstrap?: string;
  declarations?: string;
  entryComponents?: string;
  exports?: string;
  imports?: string;
  providers?: string;
  schemas?: string;
}
export interface INgModuleMetadata extends IClassMetadata, INgModuleClassDecoratorMetadata {}
