import { Selector } from 'css-what';
import { ISelectorSet } from '../declaration-metadata/directive.interface';

export enum LookupItemType {
  Directive = 'directive',
  Component = 'component',
}

export type OwnerDetail = { [key: string]: any };
export type OwnerMergeLookup = { [key: string]: OwnerDetail };

export interface ILookupSummaryRoot {
  tagNamePrefixes: string[];
  tag?: { [key: string]: ILookupSummaryItem[] };
  attribute?: { [key: string]: ILookupSummaryItem[] };
  pseudo?: { [key: string]: ILookupSummaryItem[] };
  [key: string]: any;
}

export interface ILookupFilepaths {
  typescript: string;
  template?: string;
  styles?: string[];
}

export interface ILookupItem {
  type: LookupItemType;
  // TODO (kuyk): Deprecate filepath in favor of a ILookupFilepaths member
  //   Make sure to update all clients first!
  filepath: string;
  filepaths: ILookupFilepaths;
  identifier: string;
  selector: ISelectorSet;
  owner?: OwnerDetail;
}

export interface ILookupSummaryItem extends ILookupItem {
  primary: Selector;
}

export { Selector };
