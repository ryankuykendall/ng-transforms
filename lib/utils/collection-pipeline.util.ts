import { IConfig } from '../interfaces/collection-pipeline.interface';

export const generateCollectionPipelineStub = (): IConfig => {
  return {
    output: '',
    includes: {
      globs: [],
      directories: [],
      files: [],
    },
    excludes: {
      globs: [],
      directories: [],
      files: [],
      tsqueries: [],
    },
    commands: {
      pre: [],
      post: [],
    },
  };
};
