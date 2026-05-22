import { browser } from "$app/environment";
import { Buffer } from "buffer";

// Some parts of @stellar/stellar-sdk expect `Buffer` to exist on the global
// scope. Inject it for both the browser and SSR contexts.
if (browser) {
  window.Buffer = Buffer;
} else {
  globalThis.Buffer = Buffer;
  // @ts-expect-error - augmenting globalThis at runtime
  globalThis.window = {};
}

export default globalThis;
