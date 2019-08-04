import program from 'commander';
import ts from 'typescript';
import logger from '../utils/logger.util';
import {
  getTypescriptFileASTsFromDirectory,
  findFilesWithASTMatchingSelector,
  dumpASTNode,
} from '../utils/ast.util';

export const action = (selector: string, dir: string, cmd: program.Command) => {
  const tsFiles = getTypescriptFileASTsFromDirectory(dir);
  const tsFilesWithNodesMatchingSelector = findFilesWithASTMatchingSelector(tsFiles, selector);
  const ancestor = cmd.opts()['ancestor'] || null;
  tsFilesWithNodesMatchingSelector.forEach(({ filepath, matches }, fileIndex) => {
    logger.newline(2);
    logger.info(`Processing file`, filepath);
    matches.forEach((node: ts.Node, index) => {
      while (ancestor && node.parent && ts.SyntaxKind[node.kind] != ancestor) {
        node = node.parent;
      }
      dumpASTNode(node, index);
    });
  });
};
