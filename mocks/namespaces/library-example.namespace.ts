// Assumes Typescript 3.5 with --allowUmdGlobalAccess turned on.
//   Read more in Typescript 3.5 release notes.
namespace SomeComponentLibrary {
  // The library version. Allows multiple versions to be used in an app
  //   at the same time.
  namespace v12345 {
    namespace Components {}
    namespace Directives {}
    namespace Services {}
  }
}

// export as namespace SomeComponentLibrary;
