import { Context } from "effect";

const VendorDirectory = Context.Reference<string>("vp-adopt/VendorDirectory", {
  defaultValue: () => `${import.meta.dirname}/../vendor`,
});

export { VendorDirectory };
