import ts from 'typescript';

// TODO: Should we ensure balancing here with look ahead?
const STRIP_QUOTE_CHARS_REGEXP = /^[\`\'\"](.+)[\`\'\"]$/;

export const stripQuotes = (strLit: ts.StringLiteral | ts.Expression): string => {
  const str = strLit.getText() as string;
  return str.replace(STRIP_QUOTE_CHARS_REGEXP, '$1');
};