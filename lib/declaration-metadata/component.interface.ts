import { IClassMetadata, IInGroup } from './class.interface';
import { IHasIdentifier } from './base.interface';

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
