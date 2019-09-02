import fs from 'fs';
import path from 'path';
import * as fileutil from './file.util';

const filepath: string = path.join(__dirname, '..', '..', '..', 'package.json');
const config = fileutil.loadJSONFile(filepath);
export const VERSION = config.version;
