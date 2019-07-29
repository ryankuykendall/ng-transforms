import { IClassMetadata, IInGroup } from './class.interface';
import { IHasIdentifier } from './base.interface';
import { IType } from './type.interface';
import { ExpressionMetadata } from './expression.interface';

// TODO (ryan): Angular Components are a superset of Directive Behavior.
//  Should a good deal of this be moved to the directive.interface file?
//  Or should it be shared?

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

export interface IComponentMetadata extends IClassMetadata {
  // TODO (ryan): Flesh this out
  ngTemplate: string;
  constructorParameterMetadata?: IConstructorParameterMetadata;
  inputMembers: IInputMemberMetadata[];
  hostBindingMembers: IHostBindingMemberMetadata[];
  hostListenerMembers: IHostListenerMemberMetadata[];
  outputMembers: IOutputMemberMetadata[];
  // TO consider:
  // viewChildMembers
  // viewChildrenMembers
  contentChildMembers: IContentChildMemberMetadata[];
  contentChildrenMembers: IContentChildrenMemberMetadata[];
}
