import program from 'commander';
import JsonQuery from 'json-query';
import fs from 'fs';
import * as fileUtil from './../utils/file.util';
import path from 'path';
import logger from './../utils/logger.util';
import chalk from 'chalk';

// TODO (ryan): Move these to lib.
interface IObject {
  [key: string]: any;
}

const jsonQueryLocals = {
  // TODO (ryan): This needs to be further refined.
  // Usage:
  //   directives:count()
  //   components:count()
  count: function(input: Array<any> | undefined) {
    if (Array.isArray(input)) {
      return { count: input.length };
    }
  },

  // Usage:
  //   directives:select(filepath,identifier,selector)
  //   components:select(filepath,identifier,selector,ngTemplate)
  select: function(input: Array<any> | undefined) {
    if (Array.isArray(input)) {
      var keys: string[] = [].slice.call(arguments, 1);
      return input.map((item: IObject) => {
        return Object.keys(item).reduce((result: IObject, key: string) => {
          if (keys.includes(key)) {
            result[key] = item[key];
          }
          return result;
        }, {});
      });
    }
  },
};

export const action = (query: string, filepath: string, cmd: program.Command) => {
  const outputFile: string | null = cmd.opts()['output']
    ? path.resolve(cmd.opts()['output'])
    : null;

  if (fs.existsSync(filepath)) {
    const raw = fs.readFileSync(filepath, fileUtil.UTF8);
    let metadata: Object = JSON.parse(raw);

    if (query) {
      metadata = JsonQuery(query, {
        data: metadata,
        locals: jsonQueryLocals,
      }).value;
    }

    const jsonOutput = JSON.stringify(metadata, null, 2);
    if (outputFile) {
      fs.writeFileSync(outputFile, jsonOutput);
      logger.success('Saving metadata query results to', outputFile);
    } else {
      logger.info(
        'Metadata',
        (query && chalk.bold.yellow(`with query of ${query}`)) || '',
        '\n',
        jsonOutput
      );
    }
  } else {
    logger.error('Metadata file does not exist', filepath);
  }
};
