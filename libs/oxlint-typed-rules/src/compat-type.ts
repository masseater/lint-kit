import { Array as Arr, BigInt as BigInt_, Match, Option, Predicate, pipe } from "effect";
import type {
  Project,
  Type as NativeType,
  TypeFlags,
  UnionOrIntersectionType,
} from "typescript/sync";

import { CompatSymbol } from "./compat-symbol.ts";

interface PseudoBigInt {
  readonly negative: boolean;
  readonly base10Value: string;
}

type LiteralValue = string | number | boolean | PseudoBigInt;

const ZERO = 0n;

const pseudoBigInt = (value: bigint): PseudoBigInt => ({
  negative: value < ZERO,
  base10Value: BigInt_.abs(value).toString(),
});

const literalValueOf = (native: NativeType): Option.Option<LiteralValue> =>
  Option.liftPredicate(native, (type) => type.isLiteralType()).pipe(
    Option.map(({ value }) =>
      Match.value(value).pipe(
        Match.when(Predicate.isBigInt, pseudoBigInt),
        Match.orElse((primitive) => primitive),
      ),
    ),
  );

const isUnionOrIntersection = (type: NativeType): type is UnionOrIntersectionType =>
  type.isUnionType() || type.isIntersectionType();

const constituentsOf = (native: NativeType): readonly NativeType[] =>
  Option.liftPredicate(native, isUnionOrIntersection).pipe(
    Option.map((type) => type.getTypes()),
    Option.getOrElse((): readonly NativeType[] => []),
  );

class CompatType {
  static readonly #interned = new WeakMap<NativeType, CompatType>();

  public readonly native: NativeType;

  public readonly flags: TypeFlags;

  public readonly intrinsicName: string | undefined;

  public readonly value: LiteralValue | undefined;

  public readonly isUnion: () => boolean;

  public readonly isLiteral: () => boolean;

  public readonly isStringLiteral: () => boolean;

  public readonly isNumberLiteral: () => boolean;

  readonly #project: Project;

  #symbol: Option.Option<CompatSymbol | undefined> = Option.none();

  #aliasSymbol: Option.Option<CompatSymbol | undefined> = Option.none();

  #types: readonly CompatType[] | undefined;

  private constructor(project: Project, native: NativeType) {
    this.#project = project;
    this.native = native;
    this.flags = native.flags;
    this.intrinsicName = Option.liftPredicate(native, (type) => type.isIntrinsicType()).pipe(
      Option.map(({ intrinsicName }) => intrinsicName),
      Option.getOrUndefined,
    );
    this.value = Option.getOrUndefined(literalValueOf(native));
    this.isUnion = native.isUnionType.bind(native);
    this.isLiteral = native.isLiteralType.bind(native);
    this.isStringLiteral = native.isStringLiteralType.bind(native);
    this.isNumberLiteral = native.isNumberLiteralType.bind(native);
  }

  public static intern(project: Project, native: NativeType): CompatType {
    return Option.fromNullishOr(CompatType.#interned.get(native)).pipe(
      Option.getOrElse(() => {
        const created = new CompatType(project, native);
        CompatType.#interned.set(native, created);
        return created;
      }),
    );
  }

  public get symbol(): CompatSymbol | undefined {
    const { native } = this;
    const project = this.#project;
    this.#symbol = Option.orElse(this.#symbol, () =>
      Option.some(CompatSymbol.optional(project, native.getSymbol())),
    );
    return Option.getOrUndefined(this.#symbol);
  }

  public get aliasSymbol(): CompatSymbol | undefined {
    const { native } = this;
    const project = this.#project;
    this.#aliasSymbol = Option.orElse(this.#aliasSymbol, () =>
      Option.some(CompatSymbol.optional(project, native.getAliasSymbol())),
    );
    return Option.getOrUndefined(this.#aliasSymbol);
  }

  public get types(): readonly CompatType[] {
    const project = this.#project;
    this.#types ??= pipe(
      constituentsOf(this.native),
      Arr.map((member) => CompatType.intern(project, member)),
    );
    return this.#types;
  }

  public getProperty(name: string): CompatSymbol | undefined {
    return CompatSymbol.optional(this.#project, this.native.getProperty(name));
  }

  public getProperties(): readonly CompatSymbol[] {
    const project = this.#project;
    return pipe(
      this.native.getProperties(),
      Arr.map((property) => CompatSymbol.intern(project, property)),
    );
  }
}

export { CompatType };
