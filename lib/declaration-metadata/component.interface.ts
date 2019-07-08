import { IClassMetadata, IInGroup } from './class.interface';
import { IHasIdentifier } from './base.interface';

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

export interface IComponentMetadata extends IClassMetadata {
  // TODO (ryan): Flesh this out
  bootstrappingTemplate: string;
  constructorParameterMetadata?: IConstructorParameterMetadata;
  inputMembers: IInputMemberMetadata[];
  hostBindingMembers: IHostBindingMemberMetadata[];
  hostListenerMembers: IHostListenerMemberMetadata[];
  outputMembers: IOutputMemberMetadata[];
  // TO consider:
  // viewChildMembers
  // viewChildrenMembers
  // contentChildMembers
  // contentChildrenMembers
}
