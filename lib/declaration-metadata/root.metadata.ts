import { IRootMetadata, RootMetadataType, RootType } from './root.interface';

export const rootCollectorCallback = (
  root: IRootMetadata,
  type: RootType,
  metadata: RootMetadataType
) => {
  if (!root.hasOwnProperty(type)) {
    root[type] = [];
  }

  if (root[type]) {
    const collection = root[type] as Array<RootMetadataType>;
    collection.push(metadata);
  }
};
