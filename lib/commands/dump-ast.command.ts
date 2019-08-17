import program from 'commander';
import logger from '../utils/logger.util';
import { IFileAST } from '../interfaces/ast-file.interface';
import { getTypescriptFileASTsFromDirectory, dumpASTNode } from '../utils/ast.util';

export const action = (dir: string, cmd: program.Command) => {
  const tsFiles = getTypescriptFileASTsFromDirectory(dir);
  tsFiles.forEach(({ filepath, ast }: IFileAST, index: number) => {
    logger.info(' - Processing file', filepath, '\n\n');
    dumpASTNode(ast, index);
  });
};
