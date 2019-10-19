import path from 'path';
import glob from 'glob';

export const getBestParentDirectoryBeforeMagic = (pattern: string): string | undefined => {
  // If the glob hasMagic, try to capture the most specific parent
  //   directory before the magic.
  const parsed: path.ParsedPath = path.parse(pattern);
  const components: string[] = parsed.dir.split(path.sep);
  const primeableComponents: string[] = [];
  for (const component of components) {
    if (glob.hasMagic(component)) break;
    primeableComponents.push(component);
  }

  if (primeableComponents.length > 0) {
    return path.join(...primeableComponents);
  }

  return;
};
