import {
	Asset,
	Memo,
	Networks,
	Operation,
	TransactionBuilder,
} from "@stellar/stellar-sdk";
import { server } from "./horizonQueries";

/**
 * Max fee in stroops per operation. 100,000 stroops = 0.01 XLM. A relatively
 * high fee improves the chance of the transaction being included in the ledger
 * during periods of fee surge pricing.
 */
const MAX_FEE_PER_OPERATION = "100000";

/** Network passphrase used for signing — must match the network we submit to. */
export const NETWORK_PASSPHRASE = Networks.TESTNET;

/** Number of seconds the user has to sign/submit a built transaction. */
const STANDARD_TIMEBOUNDS = 300;

export type BuiltTransaction = {
	transaction: string; // base64 XDR
	network_passphrase: string;
};

export type PaymentTransactionInput = {
	source: string;
	destination: string;
	/** "native" for XLM, or "CODE:ISSUER" for a custom asset. */
	asset?: string;
	amount: string | number;
	/** Optional plain-text memo. */
	memo?: string;
};

/**
 * Builds a transaction containing a single `payment` operation and an optional
 * memo. The returned XDR string can then be signed and submitted.
 */
export async function createPaymentTransaction({
	source,
	destination,
	asset = "native",
	amount,
	memo,
}: PaymentTransactionInput): Promise<BuiltTransaction> {
	const sourceAccount = await server.loadAccount(source);

	const builder = new TransactionBuilder(sourceAccount, {
		networkPassphrase: NETWORK_PASSPHRASE,
		fee: MAX_FEE_PER_OPERATION,
	});

	const sendAsset =
		asset && asset !== "native"
			? new Asset(asset.split(":")[0], asset.split(":")[1])
			: Asset.native();

	if (memo) {
		builder.addMemo(Memo.text(memo));
	}

	builder.addOperation(
		Operation.payment({
			destination,
			amount: amount.toString(),
			asset: sendAsset,
		}),
	);

	const built = builder.setTimeout(STANDARD_TIMEBOUNDS).build();

	return {
		transaction: built.toXDR(),
		network_passphrase: NETWORK_PASSPHRASE,
	};
}

export type CreateAccountTransactionInput = {
	source: string;
	destination: string;
	amount: string | number;
	memo?: string;
};

/**
 * Builds a transaction that uses `createAccount` to fund a brand-new Stellar
 * account. The minimum starting balance is 1 XLM (2 base reserves).
 */
export async function createCreateAccountTransaction({
	source,
	destination,
	amount,
	memo,
}: CreateAccountTransactionInput): Promise<BuiltTransaction> {
	if (parseFloat(amount.toString()) < 1) {
		throw new Error("Insufficient starting balance: minimum is 1 XLM");
	}

	const sourceAccount = await server.loadAccount(source);

	const builder = new TransactionBuilder(sourceAccount, {
		networkPassphrase: NETWORK_PASSPHRASE,
		fee: MAX_FEE_PER_OPERATION,
	});

	if (memo) {
		builder.addMemo(Memo.text(memo));
	}

	builder.addOperation(
		Operation.createAccount({
			destination,
			startingBalance: amount.toString(),
		}),
	);

	const built = builder.setTimeout(STANDARD_TIMEBOUNDS).build();

	return {
		transaction: built.toXDR(),
		network_passphrase: NETWORK_PASSPHRASE,
	};
}
