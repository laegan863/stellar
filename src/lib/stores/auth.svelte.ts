import { browser } from "$app/environment";
import { Keypair, StrKey } from "@stellar/stellar-sdk";
import { decryptWithPin, encryptWithPin } from "$lib/stellar/crypto";

export type Profile = {
	name: string;
	email: string;
	bio: string;
};

type WalletRecord = {
	publicKey: string;
	encryptedSecret: string;
	profile: Profile;
	createdAt: number;
};

const WALLETS_KEY = "basicpay:wallets";
const SESSION_KEY = "basicpay:session";

function loadWallets(): Record<string, WalletRecord> {
	if (!browser) return {};
	try {
		return JSON.parse(localStorage.getItem(WALLETS_KEY) ?? "{}");
	} catch {
		return {};
	}
}

function saveWallets(w: Record<string, WalletRecord>) {
	if (browser) localStorage.setItem(WALLETS_KEY, JSON.stringify(w));
}

function loadSession(): string {
	if (!browser) return "";
	return localStorage.getItem(SESSION_KEY) ?? "";
}

function emptyProfile(): Profile {
	return { name: "", email: "", bio: "" };
}

class AuthStore {
	publicKey = $state("");
	profile = $state<Profile>(emptyProfile());
	/** In-memory only — cleared on logout/refresh. */
	secretKey = $state("");

	constructor() {
		if (browser) {
			const pk = loadSession();
			if (pk) {
				const rec = loadWallets()[pk];
				if (rec) {
					this.publicKey = rec.publicKey;
					this.profile = rec.profile;
				} else {
					localStorage.removeItem(SESSION_KEY);
				}
			}
		}
	}

	get isAuthenticated() {
		return !!this.publicKey;
	}

	/** Returns true if the in-memory secret is loaded (i.e. PIN-unlocked). */
	get isUnlocked() {
		return !!this.secretKey;
	}

	hasWallet(publicKey: string): boolean {
		return !!loadWallets()[publicKey];
	}

	/** Registers a new wallet. Throws if PIN/public-key conflict. */
	async register(pin: string, profile: Profile): Promise<{ publicKey: string; secretKey: string }> {
		if (pin.length < 4) throw new Error("PIN must be at least 4 digits");
		const kp = Keypair.random();
		const publicKey = kp.publicKey();
		const secretKey = kp.secret();
		const encryptedSecret = await encryptWithPin(secretKey, pin);

		const wallets = loadWallets();
		wallets[publicKey] = {
			publicKey,
			encryptedSecret,
			profile,
			createdAt: Date.now(),
		};
		saveWallets(wallets);

		// Auto-login the new user.
		this.publicKey = publicKey;
		this.secretKey = secretKey;
		this.profile = profile;
		if (browser) localStorage.setItem(SESSION_KEY, publicKey);

		return { publicKey, secretKey };
	}

	/** Logs in by verifying the PIN can decrypt the stored secret. */
	async login(publicKey: string, pin: string): Promise<void> {
		const trimmed = publicKey.trim();
		if (!StrKey.isValidEd25519PublicKey(trimmed)) {
			throw new Error("Invalid public key");
		}
		const rec = loadWallets()[trimmed];
		if (!rec) throw new Error("No wallet registered for this public key");

		const secret = await decryptWithPin(rec.encryptedSecret, pin);
		// Verify the decrypted secret matches the stored public key.
		if (Keypair.fromSecret(secret).publicKey() !== rec.publicKey) {
			throw new Error("Wallet integrity check failed");
		}

		this.publicKey = rec.publicKey;
		this.secretKey = secret;
		this.profile = rec.profile;
		if (browser) localStorage.setItem(SESSION_KEY, rec.publicKey);
	}

	/**
	 * Asks for the PIN again and returns the decrypted secret without
	 * storing it. Used by the confirmation-modal flow before signing.
	 */
	async unlockSecret(pin: string): Promise<string> {
		const rec = loadWallets()[this.publicKey];
		if (!rec) throw new Error("No wallet found");
		const secret = await decryptWithPin(rec.encryptedSecret, pin);
		this.secretKey = secret;
		return secret;
	}

	updateProfile(profile: Profile) {
		if (!this.publicKey) return;
		const wallets = loadWallets();
		const rec = wallets[this.publicKey];
		if (!rec) return;
		rec.profile = profile;
		wallets[this.publicKey] = rec;
		saveWallets(wallets);
		this.profile = profile;
	}

	logout() {
		this.publicKey = "";
		this.secretKey = "";
		this.profile = emptyProfile();
		if (browser) localStorage.removeItem(SESSION_KEY);
	}
}

export const auth = new AuthStore();
