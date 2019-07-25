# NgTransform

## Goal

Mostly for fun and getting exposure to developing with the [Typescript](https://www.typescriptlang.org/) AST tooling for creating transforms and collecting metadata about [Angular](https://angular.io) projects.

## Why?

Augment build time strategy with run-time component library strategy using Angular Elements.

## Setup

```
$ npm i
```

## Building command-line tools

```
$ npm run build
```

## Seeing a list of all of the available commands

```
npm run cli --help
```

## Executing command-line tools

```
$ npm run cli <command> <arguments>
```

## A note about directories

mocks/ Contains sample Angular files used to testing CLI.
stubs/ Contains base Angular files used for generating code.

## Useful tools for development

- [https://ts-ast-viewer.com/](https://ts-ast-viewer.com/)

## Example usage

In the specified directory, get all arrow functions defined in a variable statement that are at the root of a source file. Then ascend the ancestry to the VariableStatement and display the results.

### Inline templates, styles, and generated styles

For testing purposes, assumes that the developer has generated CSS from SCSS files:

```
sass mocks:bazel-out/mocks
```

_On project mocks directory:_

```
$ ./dist/index.js ng-inline-resources mocks/components -R --src . --build ./bazel-out -p
```

_On locally cloned Angular/Material src:_

```
$ ./dist/index.js ng-inline-resources ~/ng-components/components/src -R --src ~/ng-components/components/src --build ~/ng-components/components/bazel-out -p
```

_In a build environment where SCSS and template files are outputted into separate build directory roots_

```
./dist/index.js ng-inline-resources ~/ng-components/components/src -R -p \
   --src ~/ng-components/components/src \
   --template-build ~/ng-components/components/bazel-out \
   --css-build ~/ng-components/components/bazel-bin
```

### Collecting Angular Directive, Component, and Module interface metadata by directory

```
$ npm run cli ng-metadata-collect <directory/file>
```

Outputing the JSON metadata output to a file.

```
$ npm run cli ng-metadata-collect <directory/file> -o <output-file-name>
```

### Generating a key for an Angular project metadata file (useful for understanding the interfaces that can be queried for using JSON Query syntax in ng-metadata-query command)

```
$ npm run cli ng-metadata-key <metadata-file>
```

### Querying a Angular project metadata file with [json-query](https://github.com/mmckegg/json-query) (assumes output file from collect-ng-metadata)

```
$ npm run cli ng-metadata-query <query> <metadata-file>
```

Query for Directive filepath, identifier, and selector:

```
$ npm run cli ng-metadata-query 'directives:select(filepath,identifier,selector)' <metadata-file>
```

More examples coming soon!

### Query an Angular Project for AST Sub Trees

```
$ npm run cli ast-query "SourceFile > VariableStatement ArrowFunction" <directory> --ancestor VariableStatement
```

In the specified directory, get all decorators with the name 'Component.' Then ascend the ancestry to the associated class declaration and display the results.

```
$ npm run cli ast-query "Decorator[expression.expression.escapedText=Component]" <directory> --ancestor ClassDeclaration
```

Same as above, but in this case getting ClassDeclarations with the Directive decorator:

```
$ npm run cli ast-query "Decorator[expression.expression.escapedText=Directive]" <directory> --ancestor ClassDeclaration
```

And NgModules:

```
$ npm run cli ast-query "Decorator[expression.expression.escapedText=NgModule]" <directory> --ancestor ClassDeclaration
```
