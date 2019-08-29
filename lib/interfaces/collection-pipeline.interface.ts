export type Filepath = string;

// TODO (ryan): Create a generator for this Config file.

// QUESTION (ryan): Should developers be able to include/exclude top level
//   collection types such as ngModules, components, etc.?

// QUESTION (ryan): Should developers be able to include a relative file path
//   for any of these interfaces (IConfig level, IIncludes level, IExcludes level?)

/**
 * IConfig resolution priority
 * 1. Includes builds the collection
 * 2. Excludes trim down the collection
 */
export interface IConfig {
  output: Filepath;
  includes: IIncludes;
  excludes?: IExcludes;
  commands?: ICommands;
}

/**
 * IIncludes creates a collection that is a union of:
 *  - Resolved globs
 *  - All .ts files in a directory (recursive)
 *  - All specific .ts files
 */
export interface IIncludes {
  globs?: string[];
  directories?: Filepath[];
  files?: Filepath[];
}

/**
 * IExcludes prunes the collection created by IInclude
 * Order of operation:
 *  1. Prune set based on filepaths collected through resolved globs
 *  2. Prune set based on .ts filepaths in directory subtree
 *  3. Prune set based on specific .ts files
 *  4. Prune set based on tsqueries from ASTs of remaining files
 */
export interface IExcludes {
  globs?: string[];
  directories?: Filepath[];
  files?: Filepath[];
  tsqueries?: string[];
}

export interface ICommands {
  pre?: string[];
  post?: string[];
}
