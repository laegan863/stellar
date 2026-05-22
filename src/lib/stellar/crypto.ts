/**
 * AES-GCM encryption helpers for protecting a Stellar secret key with a PIN.
 *
 * We derive a 256-bit AES key from the user's PIN using PBKDF2-SHA-256
 * (100k iterations + per-record salt) and encrypt the secret with a fresh
 * random IV. The output is a single base64 string that can be safely stored
 * in localStorage — without the PIN it is computationally infeasible to
 * recover the underlying Stellar secret.
 */

const PBKDF2_ITERATIONS = 100_000;

function bytesToB64(bytes: Uint8Array): string {
	let bin = "";
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin);
}

function b64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
	const baseKey = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(pin) as BufferSource,
		{ name: "PBKDF2" },
		false,
		["deriveKey"],
	);
	return crypto.subtle.deriveKey(
		{ name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
		baseKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);
}

/** Encrypts `plaintext` with a key derived from `pin`. */
export async function encryptWithPin(plaintext: string, pin: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const key = await deriveKey(pin, salt);
	const ct = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv: iv as BufferSource },
			key,
			new TextEncoder().encode(plaintext) as BufferSource,
		),
	);
	return JSON.stringify({
		v: 1,
		s: bytesToB64(salt),
		i: bytesToB64(iv),
		c: bytesToB64(ct),
	});
}

/** Returns the decrypted plaintext, or throws if the PIN is wrong. */
export async function decryptWithPin(payload: string, pin: string): Promise<string> {
	let parsed: { s: string; i: string; c: string };
	try {
		parsed = JSON.parse(payload);
	} catch {
		throw new Error("Corrupted wallet record");
	}
	const salt = b64ToBytes(parsed.s);
	const iv = b64ToBytes(parsed.i);
	const ct = b64ToBytes(parsed.c);
	const key = await deriveKey(pin, salt);
	try {
		const pt = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: iv as BufferSource },
			key,
			ct as BufferSource,
		);
		return new TextDecoder().decode(pt);
	} catch {
		throw new Error("Invalid PIN");
	}
}
