import { IClassMetadata, IInGroup } from './class.interface';
import { IHasIdentifier } from './base.interface';

export interface IInputMemberMetadata extends IHasIdentifier, IInGroup {
  bindingPropertyName?: string;
}
export interface IHostBindingMemberMetadata extends IHasIdentifier, IInGroup {}
export interface IOutputMemberMetadata extends IHasIdentifier, IInGroup {}

export interface IComponentMetadata extends IClassMetadata {
  // TODO (ryan): Flesh this out
  bootstrappingTemplate: string;
  inputMembers: IInputMemberMetadata[];
  hostBindingMembers: IHostBindingMemberMetadata[];
  outputMembers: IOutputMemberMetadata[];
  // TO consider:
  // viewChildMembers
  // viewChildrenMembers
  // contentChildMembers
  // contentChildrenMembers
}
