import { IClassMetadata, IInGroup } from './class.interface';
import { IHasIdentifier } from './base.interface';
import { ExpressionMetadata } from './expression.interface';
import { IDirectiveClassDecoratorMetadata } from './directive.interface';
import { ViewEncapsulation, ChangeDetectionStrategy } from './component-decorator.property';

// TODO (ryan): Angular Components are a superset of Directive Behavior.
//  A good deal of this needs to be moved to the directive.interface file?

//
export interface IConstructorParameterAttribute extends IHasIdentifier {
  attributeName: string;
}

export enum ConstructorParameterRefType {
  ChangeDetectorRef = 'ChangeDetectorRef',
  ComponentRef = 'ComponentRef',
  EmbeddedViewRef = 'EmbeddedViewRef',
  ElementRef = 'ElementRef',
  TemplateRef = 'TemplateRef',
  ViewRef = 'ViewRef',
  ViewContainerRef = 'ViewContainerRef',
}

export interface IConstructorParameterRefMetadata extends IHasIdentifier {
  type: ConstructorParameterRefType;
}

export interface IConstructorParameterMetadata {
  attributes: IConstructorParameterAttribute[];
  refs: IConstructorParameterRefMetadata[];
}

export interface IInputMemberMetadata extends IHasIdentifier, IInGroup {
  bindingPropertyName?: string;
}

export interface IHostBindingMemberMetadata extends IHasIdentifier, IInGroup {
  // QUESTION (ryan): Do we want to break this down into the attributeName and attribute value?
  hostPropertyName?: string;
}

export interface IHostListenerMemberMetadata extends IHasIdentifier, IInGroup {
  eventName?: string;
  args?: string[];
}

export interface IOutputMemberMetadata extends IHasIdentifier, IInGroup {
  bindingPropertyName?: string;
}

export enum ContentChildDecoratorOption {
  Read = 'read',
  Static = 'static',
}

export interface IContentChildMemberMetadata extends IHasIdentifier, IInGroup {
  selector: ExpressionMetadata;
  read?: ExpressionMetadata;
  static?: boolean;
}

export enum ContentChildrenDecoratorOption {
  Descendants = 'descendants',
  Read = 'read',
}

export interface IContentChildrenMemberMetadata extends IHasIdentifier, IInGroup {
  // TODO (ryan): Collect Metadata described here:
  //   https://angular.io/api/core/ContentChildren
  descendants?: boolean;
  read?: ExpressionMetadata;
  selector: ExpressionMetadata;
}
export type ComponentAssetFilepath = string;

// TODO (ryan): Update this to be more useful once we can track down a good example
//   of where this is used (It is currently not used in Angular Material.)
export interface IProvider {
  raw: string;
}

export interface IComponentClassDecoratorMetadata {
  changeDetection?: ChangeDetectionStrategy;
  encapsulation?: ViewEncapsulation;
  preserveWhitespaces?: boolean;
  styles?: string[];
  styleUrls?: ComponentAssetFilepath[];
  template?: string;
  templateUrl?: ComponentAssetFilepath;
  viewProviders?: IProvider[];
}

export interface IComponentMetadata
  extends IClassMetadata,
    IDirectiveClassDecoratorMetadata,
    IComponentClassDecoratorMetadata {
  // TODO (ryan): Flesh this out
  ngTemplate: string;
  constructorParameterMetadata?: IConstructorParameterMetadata;

  // Could be inherited from Decorator Metadata.
  inputMembers: IInputMemberMetadata[];
  hostBindingMembers: IHostBindingMemberMetadata[];
  hostListenerMembers: IHostListenerMemberMetadata[];
  outputMembers: IOutputMemberMetadata[];
  contentChildMembers: IContentChildMemberMetadata[];
  contentChildrenMembers: IContentChildrenMemberMetadata[];

  // TO consider, but that are component specific:
  // viewChildMembers
  // viewChildrenMembers
}
