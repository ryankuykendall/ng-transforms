import ts from 'typescript';
import { IHasFilepath, IHasIdentifier } from './base.interface';

export interface IClassMetadata extends IHasIdentifier, IHasFilepath {}
