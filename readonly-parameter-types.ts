interface PackageTypes {
  readonly from: "package";
  readonly package: string;
  readonly name: string[];
}

interface LibTypes {
  readonly from: "lib";
  readonly name: string[];
}

interface FileTypes {
  readonly from: "file";
  readonly path?: string;
  readonly name: string[];
}

const readonlyParameterTypes: (FileTypes | LibTypes | PackageTypes)[] = [
  { from: "lib", name: ["Uint8Array"] },
  {
    from: "package",
    package: "@oxlint/plugins",
    name: [
      "Context",
      "Location",
      "Node",
      "Range",
      "Rule",
      "RuleMeta",
      "SourceCode",
      "VisitorWithHooks",
    ],
  },
  {
    from: "package",
    package: "oxlint",
    name: ["InvalidTestCase", "Rule", "TestCases", "ValidTestCase"],
  },
  {
    from: "package",
    package: "typescript",
    name: [
      "API",
      "BinaryExpression",
      "BindingElement",
      "CallExpression",
      "Checker",
      "CompilerHost",
      "CompilerOptions",
      "ConfigFileResponse",
      "Declaration",
      "DeclarationBase",
      "ElementAccessExpression",
      "ExportDeclaration",
      "ExportSpecifier",
      "Expression",
      "ExpressionBase",
      "JSDocCallbackTag",
      "JSDocTagBase",
      "JSDocTypedefTag",
      "ModuleDeclaration",
      "Node",
      "NodeHandle",
      "NumericLiteral",
      "ParsedCommandLine",
      "Program",
      "Project",
      "PropertyAccessExpression",
      "Signature",
      "Snapshot",
      "SourceFile",
      "StringLiteral",
      "Symbol",
      "Type",
      "TypeChecker",
      "TypeNode",
      "TypeNodeBase",
      "UnionTypeNode",
      "VariableDeclaration",
      "VariableDeclarationList",
    ],
  },
  {
    from: "package",
    package: "effect",
    name: ["Cause", "Context", "Effect", "Exit", "Layer", "Option", "Ref", "Stream"],
  },
  { from: "package", package: "@commitlint/types", name: ["QualifiedConfig"] },
  {
    from: "file",
    path: "upstream/attw-core/lib/checkPackage.d.ts",
    name: ["CheckPackageOptions"],
  },
  { from: "file", path: "../vite-plus-adopt/dist/attw.d.mts", name: ["CheckPackageOptions"] },
  {
    from: "package",
    package: "@textlint/config-loader",
    name: ["TextlintLoadPackagesFromRawConfigResult"],
  },
  {
    from: "file",
    path: "src/types.ts",
    name: ["CommitlintConfig", "TextlintConfig", "ToolSections"],
  },
  {
    from: "package",
    package: "steiger",
    name: ["ConfigObject", "GlobalIgnore", "Plugin"],
  },
  {
    from: "file",
    name: [
      "BoundSymbol",
      "CompatSymbol",
      "CompatType",
      "FileBinding",
      "SymbolTable",
      "TypedContext",
    ],
  },
];

export { readonlyParameterTypes };
export type { FileTypes, LibTypes, PackageTypes };
