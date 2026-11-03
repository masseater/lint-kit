import { Option } from "effect";

const memoizeByKey = <Key extends WeakKey, Value>(
  compute: (key: Key) => Value,
): ((key: Key) => Value) => {
  const cache = new WeakMap<Key, Value>();
  return (key) =>
    Option.fromNullishOr(cache.get(key)).pipe(
      Option.getOrElse(() => {
        const computed = compute(key);
        cache.set(key, computed);
        return computed;
      }),
    );
};

export { memoizeByKey };
