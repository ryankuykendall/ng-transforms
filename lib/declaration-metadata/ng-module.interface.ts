import { IClassMetadata } from './class.interface';

export interface INgModuleClassDecoratorMetadata {}
export interface INgModuleMetadata extends IClassMetadata, INgModuleClassDecoratorMetadata {}
