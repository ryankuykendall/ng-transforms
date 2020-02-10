import chalk from 'chalk';

const BOMB: string = '💥';
const CHECK: string = '✅';
const HMMM: string = '🤔';

const infoTheme = chalk.yellow.bold;
const successTheme = chalk.bgGreen.black;
const warnTheme = chalk.bgYellow.black.bold;
const errorTheme = chalk.bgRed.black.bold;

export const info = (label: string, ...details: any[]) => {
  console.info(infoTheme(label), ...details);
};

export const success = (label: string, ...details: any[]) => {
  console.log(CHECK, successTheme(label), ...details);
};

export const warn = (label: string, ...details: any[]) => {
  console.warn(HMMM, warnTheme(label), ...details);
};

export const error = (label: string, ...details: any[]) => {
  console.error(BOMB, errorTheme(label), ...details);
};

const megabytes = (size: number): string => {
  return `${Math.round((size / 1024 / 1024) * 100) / 100} MB`;
};

export const memory = (label: string, ...details: any[]) => {
  const used = process.memoryUsage();
  console.log(
    infoTheme(label),
    ...details,
    `
  Memory Usage Summary:
   - rss:       ${megabytes(used.rss)}
   - heapTotal: ${megabytes(used.heapTotal)}
   - heapUsed:  ${megabytes(used.heapUsed)}
   - external:  ${megabytes(used.external)}

   `
  );
};

export const newline = (count: number = 1) => {
  console.log('\n'.repeat(count));
};

export const logger = {
  info,
  success,
  warn,
  error,
  memory,
  newline,
};

export default logger;
// TODO (ryan): Add a logging method for handling messages that include ts.Node arguments.
