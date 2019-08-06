import { IClassMetadata, IInGroup } from './class.interface';
import { IAngularCoreClassMemberMetadata } from './angular-core.interface';
import { IDirectiveClassDecoratorMetadata } from './directive.interface';
import { ViewEncapsulation, ChangeDetectionStrategy } from './component-decorator.property';

export type ComponentAssetFilepath = string;

// TODO (ryan): Continue to refine this...
export interface IAnimation {
  raw: string;
}

// TODO (ryan): Continue to refine this...
export interface IEntryComponent {
  raw: string;
}

export enum ModuleIdType {
  CommonJS = 'CommonJS',
  SystemJS = 'SystemJS',
}

export interface IInterpolation {
  start: string;
  end: string;
}

// TODO (ryan): Update this to be more useful once we can track down a good example
//   of where this is used (It is currently not used in Angular Material.)
export interface IProvider {
  raw: string;
}

// TODO (ryan): Move this into component-decorator.interface.ts
//   Should this also extend IDirectiveClassDecoratorMetadata?
export interface IComponentClassDecoratorMetadata {
  animations?: IAnimation[];
  changeDetection?: ChangeDetectionStrategy;
  encapsulation?: ViewEncapsulation;
  entryComponents?: IEntryComponent[];
  interpolation?: IInterpolation;
  moduleId?: ModuleIdType;
  preserveWhitespaces?: boolean;
  styles?: string[];
  styleUrls?: ComponentAssetFilepath[];
  template?: string;
  templateUrl?: ComponentAssetFilepath;
  viewProviders?: IProvider[];
}

export interface IComponentMetadata
  extends IClassMetadata,
    IAngularCoreClassMemberMetadata,
    IDirectiveClassDecoratorMetadata,
    IComponentClassDecoratorMetadata {
  // TODO (ryan): Flesh this out
  ngTemplate: string[];
}
