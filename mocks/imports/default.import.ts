import fs from 'fs'; // namespace binding
import program from 'commander'; // namespace binding
import * as goog from '@angular/compiler'; // namespace import
import {
  // named bindings
  stripQuotes,
  STRIP_QUOTE_CHARS_REGEXP as stripRegexp,
} from './../../lib/utils/string-literal.util';

export class Foo {}
