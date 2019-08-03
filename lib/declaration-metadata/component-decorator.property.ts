// TODO (ryan):
//   1. Do the same thing for Directives and NgModule!
//   2. Add the remaining properties!

export enum Property {
  Animations = 'animations',
  ChangeDetection = 'changeDetection',
  Encapsulation = 'encapsulation',
  EntryComponents = 'entryComponents',
  Interpolation = 'interpolation',
  ModuleId = 'moduleId',
  PreserveWhitespaces = 'preserveWhitespaces',
  Styles = 'styles',
  StyleUrls = 'styleUrls',
  Template = 'template',
  TemplateUrl = 'templateUrl',
  ViewProviders = 'viewProviders',
}

export const CHANGE_DETECTION_STRATEGY = 'ChangeDetectionStrategy';
// TODO (ryan): We should probably just get this from @angular/core
export enum ChangeDetectionStrategy {
  OnPush = 'OnPush',
  Default = 'Default',
}

export const VIEW_ENCAPSULATION = 'ViewEncapsulation';
// TODO (ryan): We should probably just get this from @angular/core
export enum ViewEncapsulation {
  Native = 'Native',
  Emulated = 'Emulated',
  None = 'None',
  ShadowDom = 'ShadowDom',
}
