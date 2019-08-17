import program from 'commander';
import JsonQuery from 'json-query';
import fs from 'fs';
import * as fileUtil from './../utils/file.util';
import path from 'path';
import logger from './../utils/logger.util';
import chalk from 'chalk';

export const action = (filepath: string, cmd: program.Command) => {
  const outputFile: string | null = cmd.opts()['output']
    ? path.resolve(cmd.opts()['output'])
    : null;
  const maxDepth: number = cmd.opts()['depth'] ? parseInt(cmd.opts()['depth'], 10) : Infinity;
  const indentLevel: number = cmd.opts()['indent']
    ? parseInt(cmd.opts()['indent'], 10)
    : DEFAULT_KEY_INDENT;

  if (fs.existsSync(filepath)) {
    const raw = fs.readFileSync(filepath, fileUtil.UTF8);
    const metadata = JSON.parse(raw);
    logger.success('Output key');
    const key = generateKeyFromData(metadata);
    // console.log(JSON.stringify(key, null, 2));

    // const keyPresentation = generateKeyPresentationFromOutputNode(key);
    // console.log(chalk.bgGreen.black('Output key presentation'));
    // console.log(keyPresentation);

    const trie = generateTrieFromKeyData(key);
    const triePresentation = generateKeyPresentationFromTrie(trie, maxDepth, indentLevel);

    if (outputFile) {
      fs.writeFileSync(outputFile, triePresentation);
      logger.success('Saving metadata file key to', outputFile);
    } else {
      logger.info('Metadata key', '\n', triePresentation);
    }
  } else {
    logger.error('Metadata file does not exist', filepath);
  }
};

interface IOutputNode {
  label?: string;
  collection: boolean;
  children: IOutputNode[];
  depth: number;
}

const generateOutputNodeStub = (): IOutputNode => {
  return {
    collection: false,
    children: [],
    depth: 0,
  };
};

const DEFAULT_KEY_INDENT: number = 2;
const TRIE_NODE_COUNT_PLACEHOLDER: string = 'COUNT_PLACEHOLDER';
interface TrieNodeProperties {
  count: number;
  children: TrieNode;
}
type TrieNode = Map<string, TrieNodeProperties>;

const generateTrieFromKeyData = (key: IOutputNode): TrieNode => {
  const trie: TrieNode = new Map<string, TrieNodeProperties>();

  /**
   * TODO (ryan): Have the start of this, but it needs to be refined
   *
   *   components[20]
   *     ngTemplate
   *     constructorDef
   *       injectedProperties[3]
   *        parameters[2]
   */
  const generateNodeName = (node: IOutputNode): string => {
    const label = node.label || '$root';
    const suffix: string | undefined = node.collection
      ? `${chalk.cyanBright.bold('[')}${TRIE_NODE_COUNT_PLACEHOLDER}${chalk.cyanBright.bold(']')}`
      : ` ${chalk.cyanBright('_')}${TRIE_NODE_COUNT_PLACEHOLDER}${chalk.cyanBright('_')}`;
    if (suffix) {
      return `${chalk.yellow(label)}${suffix}`;
    }

    return `${label}`;
  };

  const visitNode = (node: IOutputNode, parent: TrieNode) => {
    const name = generateNodeName(node);
    if (!parent.has(name)) {
      parent.set(name, {
        count: 0,
        children: new Map<string, TrieNodeProperties>(),
      });
    }
    const newSharedParent = parent.get(name);
    if (newSharedParent) {
      newSharedParent.count += 1;
      node.children.forEach((child: IOutputNode) => {
        visitNode(child, newSharedParent.children);
      });
    }
  };

  visitNode(key, trie);

  return trie;
};

const generateKeyPresentationFromTrie = (
  trie: TrieNode,
  maxDepth: number = Infinity,
  indent: number = DEFAULT_KEY_INDENT
): string => {
  const lines: string[] = [];
  const visit = (node: TrieNode, depth = 0) => {
    if (depth > maxDepth) return;

    Array.from(node.entries())
      .sort(([x], [y]) => {
        return x < y ? -1 : 1;
      })
      .forEach(([label, childTrie]) => {
        let updatedLabel = label;
        if (childTrie.count > 0) {
          updatedLabel = label.replace(TRIE_NODE_COUNT_PLACEHOLDER, `${childTrie.count}`);
        }
        lines.push(`${''.padStart(indent * depth, ' ')}${updatedLabel}`);
        visit(childTrie.children, depth + 1);
      });
  };

  visit(trie);
  return lines.join('\n');
};

const generateKeyFromData = (data: Object | Array<any>): IOutputNode => {
  const key = generateOutputNodeStub();
  const visit = (node: Object | Array<any>, keyRef: IOutputNode) => {
    if (Array.isArray(node)) {
      keyRef.collection = true;
      node.forEach((child: Object | Array<any>) => {
        visit(child, keyRef);
      });
    } else if (typeof node === 'object') {
      [...Object.entries(node)].forEach(([label, child]) => {
        const childKeyRef = generateOutputNodeStub();
        childKeyRef.label = label;
        childKeyRef.depth = keyRef.depth + 1;
        visit(child, childKeyRef);
        keyRef.children.push(childKeyRef);
      });
    }
  };

  visit(data, key);

  return key;
};

const generateKeyPresentationFromOutputNode = (
  key: IOutputNode,
  indent: number = DEFAULT_KEY_INDENT
): string => {
  const keyPresentation: string[] = [];
  const keyVisit = (node: IOutputNode) => {
    keyPresentation.push(
      `${''.padStart(indent * node.depth, ' ')}${node.label}${node.collection ? '[]' : ''}`
    );
    node.children.forEach((child: IOutputNode) => {
      keyVisit(child);
    });
  };
  keyVisit(key);

  return keyPresentation.join('\n');
};
