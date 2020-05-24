import child_process from 'child_process';
import path from 'path';

export interface IFindResult {
  categorized: Map<string, string[]>;
  uncategorized: string[];
}

export const findAllInDirectory = (dirname: string): IFindResult => {
  const categorized: Map<string, string[]> = new Map<string, string[]>();
  const uncategorized: string[] = [];

  const response = child_process.spawnSync('find', [dirname]);
  response.stdout
    .toString()
    .split('\n')
    .forEach((filepath: string) => {
      const extname = path.extname(filepath);
      if (extname.length > 0) {
        let collection = categorized.get(extname);
        if (!collection) {
          collection = [];
          categorized.set(extname, collection);
        }
        collection.push(filepath);
      } else {
        uncategorized.push(filepath);
      }
    });

  return {
    categorized,
    uncategorized,
  };
};
