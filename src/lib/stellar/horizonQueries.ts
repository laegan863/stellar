import { Horizon, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";

/**
 * Horizon server URL for the Stellar Testnet.
 *
 * For a production app, swap this for `https://horizon.stellar.org` and
 * use the public network passphrase from `Networks.PUBLIC`.
 */
export const HORIZON_URL = "https://horizon-testnet.stellar.org";

/** Singleton Horizon `Server` instance used for all Testnet queries. */
export const server = new Horizon.Server(HORIZON_URL);

/**
 * Fetches the balances for a Stellar account from Horizon.
 *
 * @param publicKey - the G... account ID to look up
 * @returns the array of balance entries (native + any trustlines), or an
 *          empty array if the account has not yet been funded on the network.
 */
export async function fetchAccountBalances(publicKey: string) {
  if (!StrKey.isValidEd25519PublicKey(publicKey)) {
    throw new Error("Invalid Stellar public key");
  }

  try {
    const { balances } = await server.loadAccount(publicKey);
    return balances;
  } catch (err: unknown) {
    // 404 from Horizon means the account has not been created/funded yet.
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      (err as { response?: { status?: number } }).response?.status === 404
    ) {
      return [];
    }
    throw err;
  }
}

/**
 * Funds the supplied Testnet account via Friendbot.
 *
 * Friendbot only exists on Testnet — it is the canonical way to create an
 * account on the test network with 10,000 fake XLM.
 */
export async function fundWithFriendbot(publicKey: string): Promise<void> {
  if (!StrKey.isValidEd25519PublicKey(publicKey)) {
    throw new Error("Invalid Stellar public key");
  }

  const response = await fetch(
    `https://friendbot.stellar.org/?addr=${encodeURIComponent(publicKey)}`,
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Friendbot funding failed (${response.status}): ${body}`);
  }
}

/**
 * Checks whether an account exists and is funded on the network.
 *
 * Throws an error whose `status` is 404 when the account does not exist —
 * this is the signal callers use to decide whether to use a `createAccount`
 * operation instead of `payment`.
 */
export async function fetchAccount(publicKey: string) {
  if (!StrKey.isValidEd25519PublicKey(publicKey)) {
    throw new Error("Invalid Stellar public key");
  }
  return server.loadAccount(publicKey);
}

/**
 * Submits a signed transaction (base64 XDR) to Horizon and returns the result.
 */
export async function submit(signedXDR: string, networkPassphrase: string) {
  const tx = TransactionBuilder.fromXDR(signedXDR, networkPassphrase);
  return server.submitTransaction(tx);
}
