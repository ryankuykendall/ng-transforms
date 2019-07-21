import chalk from 'chalk';

const BOMB: string = '💥';
const CHECK: string = '✅';
const HMMM: string = '🤔';

const infoTheme = chalk.green;
const successTheme = chalk.bgGreen.white;
const warnTheme = chalk.bgYellow.black.bold;
const errorTheme = chalk.bgRed.black.bold;

export const info = (label: string, details: string | undefined) => {
  console.info(infoTheme(label), details || '');
};

export const success = (label: string, details: string | undefined) => {
  console.log(CHECK, successTheme(label), details || '');
};

export const warn = (label: string, details: string | undefined) => {
  console.warn(HMMM, warnTheme(label), details || '');
};

export const error = (label: string, details: string | undefined) => {
  console.error(BOMB, errorTheme(label), details || '');
};
