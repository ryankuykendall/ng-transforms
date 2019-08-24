import { IRootMetadata, RootMetadataType, RootType } from './root.interface';

export const getRootMetadataStub = (): IRootMetadata => {
  return {
    [RootType.SourceFiles]: [],
    [RootType.Classes]: [],
    [RootType.Components]: [],
    [RootType.Directives]: [],
    [RootType.Enums]: [],
    [RootType.Functions]: [],
    [RootType.Injectables]: [],
    [RootType.Interfaces]: [],
    [RootType.Methods]: [],
    [RootType.NgModules]: [],
    [RootType.TypeAliases]: [],
  };
};

// QUESTOIN (ryan): Should this use a Generic instead?
export const rootCollectorCallback = (
  root: IRootMetadata,
  type: RootType,
  metadata: RootMetadataType
) => {
  root[type].push(metadata as any);
};
