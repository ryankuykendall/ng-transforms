import fs from 'fs';
import path from 'path';
import glob from 'glob';
import {
  ICollectionGroup,
  IPipeline,
  Filepath,
  IIncludes,
  IExcludes,
} from './../interfaces/collection-pipeline.interface';
import * as fileutil from './../utils/file.util';
import logger from './logger.util';
import { tsquery } from '@phenomnomnominal/tsquery';

export const generateCollectionGroupStub = (
  version: string,
  outDir: string = 'ng-transform-out',
  label: string
): ICollectionGroup => {
  return {
    outDir,
    version,
    pipelines: [generateCollectionPipelineStub(label)],
  };
};

export const generateCollectionPipelineStub = (label: string = 'new-pipeline'): IPipeline => {
  return {
    label,
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

export const loadCollectionGroupFromFilepath = (filepath: string): CollectionGroup => {
  if (!fs.existsSync(filepath)) throw new Error(`Cannot collection group from ${filepath}`);
  const configRaw = fs.readFileSync(filepath, fileutil.UTF8);
  const config: ICollectionGroup = JSON.parse(configRaw) as ICollectionGroup;
  return new CollectionGroup(config, path.dirname(filepath));
};

export const directoryToTsFilePattern = (dirname: string): string => {
  return path.join(dirname, '**', '*.ts');
};

export class CollectionGroup {
  private _pipelineMap: Map<string, CollectionPipeline> = new Map<string, CollectionPipeline>();

  constructor(private config: ICollectionGroup, public dirname: string) {
    this.buildPipelines();
  }

  private buildPipelines() {
    this.config.pipelines.forEach((config: IPipeline) => {
      this._pipelineMap.set(config.label, new CollectionPipeline(config, this.dirname));
    });
  }

  getPipeline(label: string): CollectionPipeline | undefined {
    return this._pipelineMap.get(label);
  }
}

export class CollectionPipeline {
  private _includes: Set<Filepath> = new Set<Filepath>();
  private _excludes: Set<Filepath> = new Set<Filepath>();
  // Cache the explicitly included files
  private _explicitIncludesFiles: Set<Filepath> = new Set<Filepath>();
  private _mergedCollections: Set<Filepath> = new Set<Filepath>();

  constructor(private config: IPipeline, public dirname: string) {
    this.resolveIncludes();
    this.resolveExcludes();
    this.mergeCollections();
  }

  get includes(): Filepath[] {
    return Array.from(this._includes);
  }

  get explicitIncludes(): Filepath[] {
    return Array.from(this._explicitIncludesFiles);
  }

  get excludes(): Filepath[] {
    return Array.from(this._excludes);
  }

  get members(): Set<Filepath> {
    return new Set<Filepath>(this._mergedCollections);
  }

  getGlobsMembers(item: IIncludes | IExcludes): Filepath[] {
    const members: Filepath[] = [];
    if (item && item.globs) {
      item.globs
        .map((pattern: string) => {
          // Prefix the pattern with the root directory of the
          //   collection pipeline filepath
          return path.join(this.dirname, pattern);
        })
        .forEach((pattern: string) => {
          glob.sync(pattern).forEach((match: string) => {
            members.push(match as Filepath);
          });
        });
    }

    return members;
  }

  getDirectoriesMembers(item: IIncludes | IExcludes): Filepath[] {
    const members: Filepath[] = [];
    if (item && item.directories) {
      item.directories
        .map(dir => {
          return path.join(this.dirname, dir);
        })
        .map((dir: string) => {
          return directoryToTsFilePattern(dir);
        })
        .forEach((pattern: string) => {
          glob.sync(pattern).forEach((match: string) => {
            members.push(match as Filepath);
          });
        });
    }

    return members;
  }

  getFilesMembers(item: IIncludes | IExcludes, errorHint: string): Filepath[] {
    const members: Filepath[] = [];
    if (item && item.files) {
      item.files
        .map(filepath => {
          return path.join(this.dirname, filepath);
        })
        .map(filepath => {
          return path.resolve(filepath);
        })
        .forEach(filepath => {
          if (!fs.existsSync(filepath)) {
            console.error(
              `File in pipeline`,
              this.config.label,
              errorHint,
              filepath,
              `does not exist`
            );
          } else {
            members.push(filepath as Filepath);
          }
        });
    }

    return members;
  }

  private resolveIncludes() {
    const { includes } = this.config;

    const globsMembers: Filepath[] = this.getGlobsMembers(includes);
    const directoriesMembers: Filepath[] = this.getDirectoriesMembers(includes);
    const filesMembers: Filepath[] = this.getFilesMembers(includes, 'includes');
    filesMembers.forEach((filepath: Filepath) => {
      this._explicitIncludesFiles.add(filepath);
    });

    [...globsMembers, ...directoriesMembers, ...filesMembers].forEach((filepath: Filepath) => {
      this._includes.add(filepath);
    });
  }

  private resolveExcludes() {
    const { excludes } = this.config;
    if (excludes) {
      const globsMembers: Filepath[] = this.getGlobsMembers(excludes);
      const directoriesMembers: Filepath[] = this.getDirectoriesMembers(excludes);
      const filesMembers: Filepath[] = this.getFilesMembers(excludes, 'excludes');

      [...globsMembers, ...directoriesMembers, ...filesMembers].forEach((filepath: Filepath) => {
        this._excludes.add(filepath);
      });
    }
  }

  private mergeCollections() {
    Array.from(this._includes).forEach((filepath: Filepath) => {
      if (!this._excludes.has(filepath)) {
        this._mergedCollections.add(filepath);
      }
    });

    // Run tsquery excludes
    if (this.config.excludes && this.config.excludes.tsqueries) {
      /**
       * TODO (ryan): Next steps here:
       *  1. Take all of the merged files
       *  2. Map to collection of filepath + file AST
       *  3. Test exclusion queries against each file
       */

      const { tsqueries } = this.config.excludes;
      this.members.forEach((filepath: Filepath) => {
        const src: string = fs.readFileSync(filepath, fileutil.UTF8);
        const ast = tsquery.ast(src);
        tsqueries.forEach((selector: string) => {
          const nodes = tsquery(ast, selector);
          if (nodes.length > 0) {
            // logger.info('TSQuery selector match for', selector, '\n\tremoving', filepath);
            this._mergedCollections.delete(filepath);
          }
        });
      });
    }
  }
}
