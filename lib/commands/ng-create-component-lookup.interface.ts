import { Selector } from 'css-what';
import { ISelectorSet } from '../declaration-metadata/directive.interface';

export enum LookupItemType {
  Directive = 'directive',
  Component = 'component',
}

export interface ILookupSummaryRoot {
  tagNamePrefixes: string[];
  tag?: { [key: string]: ILookupSummaryItem[] };
  attribute?: { [key: string]: ILookupSummaryItem[] };
  pseudo?: { [key: string]: ILookupSummaryItem[] };
  [key: string]: any;
}

export interface ILookupItem {
  type: LookupItemType;
  filepath: string;
  identifier: string;
  selector: ISelectorSet;
}

export interface ILookupSummaryItem extends ILookupItem {
  primary: Selector;
}

export { Selector };
