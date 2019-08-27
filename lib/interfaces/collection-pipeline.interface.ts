export type Filepath = string;

// TODO (ryan): Create a generator for this Config file.

// QUESTION (ryan): Should developers be able to include/exclude top level
//   collection types such as ngModules, components, etc.?

export interface IConfig {
  output: Filepath;
  includes: IIncludes;
  excludes?: IExcludes;
  commands?: ICommands;
}

export interface IIncludes {
  globs?: string[];
  directories?: Filepath[];
  files?: Filepath[];
}

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
