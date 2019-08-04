import program from 'commander';
import { dumpASTQueryForDir } from './../utils/dump-ast-query.util';

export const action = (dir: string, cmd: program.Command) => {
  dumpASTQueryForDir(dir, 'ClassDeclaration');
};
