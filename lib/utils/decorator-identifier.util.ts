// QUESTION (ryan): Why not an Enum?
export const ATTRIBUTE = 'Attribute';
export const COMPONENT = 'Component';
export const CONTENT_CHILD = 'ContentChild';
export const CONTENT_CHILDREN = 'ContentChildren';
export const DIRECTIVE = 'Directive';
export const HOST_BINDING = 'HostBinding';
export const HOST_LISTENER = 'HostListener';
export const INPUT = 'Input';
export const NG_MODULE = 'NgModule';
export const OUTPUT = 'Output';

export enum NgClassDecorator {
  Component = 'Component',
  Directive = 'Directive',
  Injectable = 'Injectable',
  NgModule = 'NgModule',
}

export enum NgDirectiveClassMemberDecorator {
  Attribute = 'Attribute',
  ContentChild = 'ContentChild',
  ContentChildren = 'ContentChildren',
  HostBinding = 'HostBinding',
  HostListener = 'HostListener',
  Input = 'Input',
  Output = 'Output',
}

export enum NgComponentClassMemberDecorator {
  ViewChild = 'ViewChild',
  ViewChildren = 'ViewChildren',
}
