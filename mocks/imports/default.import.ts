import fs from 'fs';
import program from 'commander';
import * as goog from '@angular/compiler';
import {
  stripQuotes,
  STRIP_QUOTE_CHARS_REGEXP as stripRegexp,
} from './../../lib/utils/string-literal.util';

export class Foo {}
