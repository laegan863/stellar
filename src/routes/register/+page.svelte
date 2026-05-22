<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth } from "$lib/stores/auth.svelte";
	import { errMsg, toast } from "$lib/stores/toast.svelte";

	let name = $state("");
	let email = $state("");
	let bio = $state("");
	let pin = $state("");
	let pinConfirm = $state("");
	let showPin = $state(false);
	let working = $state(false);

	let newPublicKey = $state("");
	let newSecretKey = $state("");
	let acknowledged = $state(false);

	async function submit(e: Event) {
		e.preventDefault();
		if (pin.length < 4) return toast.error("PIN must be at least 4 characters");
		if (pin !== pinConfirm) return toast.error("PINs do not match");

		working = true;
		try {
			const { publicKey, secretKey } = await auth.register(pin, {
				name: name.trim(),
				email: email.trim(),
				bio: bio.trim(),
			});
			newPublicKey = publicKey;
			newSecretKey = secretKey;
			toast.success("Wallet created");
		} catch (e) {
			toast.error(errMsg(e));
		} finally {
			working = false;
		}
	}

	async function copy(text: string, label: string) {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(`${label} copied`);
		} catch {
			toast.error(`Could not copy ${label}`);
		}
	}

	function proceed() {
		if (!acknowledged) {
			toast.error("Please acknowledge you've saved your secret key");
			return;
		}
		void goto("/dashboard");
	}
</script>

<div class="bp-auth-wrap">
	<div class="bp-auth-card">
		{#if !newPublicKey}
			<div class="card bp-card">
				<div class="card-header">
					<span class="bp-icon"><i class="bi bi-person-plus"></i></span>
					Create a wallet
				</div>
				<div class="card-body">
					<p class="text-white-50 small mb-4">
						We'll generate a fresh Stellar keypair and encrypt the secret with the PIN
						you choose. Both stay on this device.
					</p>

					<form onsubmit={submit}>
						<div class="mb-3">
							<label for="rname" class="form-label small">Display name</label>
							<input
								id="rname"
								type="text"
								class="form-control"
								placeholder="Satoshi"
								bind:value={name}
								required
							/>
						</div>
						<div class="mb-3">
							<label for="remail" class="form-label small">Email (optional)</label>
							<input
								id="remail"
								type="email"
								class="form-control"
								placeholder="you@example.com"
								bind:value={email}
							/>
						</div>
						<div class="mb-3">
							<label for="rpin" class="form-label small">PIN (min 4 characters)</label>
							<div class="input-group">
								<input
									id="rpin"
									type={showPin ? "text" : "password"}
									inputmode="numeric"
									autocomplete="new-password"
									class="form-control"
									minlength="4"
									bind:value={pin}
									required
								/>
								<button
									type="button"
									class="btn btn-bp-outline"
									aria-label={showPin ? "Hide PIN" : "Show PIN"}
									onclick={() => (showPin = !showPin)}
								>
									<i class="bi {showPin ? 'bi-eye-slash' : 'bi-eye'}"></i>
								</button>
							</div>
						</div>
						<div class="mb-4">
							<label for="rpin2" class="form-label small">Confirm PIN</label>
							<input
								id="rpin2"
								type={showPin ? "text" : "password"}
								inputmode="numeric"
								autocomplete="new-password"
								class="form-control"
								minlength="4"
								bind:value={pinConfirm}
								required
							/>
						</div>
						<button class="btn btn-bp-primary w-100" type="submit" disabled={working}>
							{#if working}
								<span class="spinner-border spinner-border-sm me-2"></span>
							{:else}
								<i class="bi bi-key me-2"></i>
							{/if}
							Generate keypair
						</button>
					</form>

					<hr class="my-4 opacity-25" />
					<p class="small text-white-50 text-center mb-0">
						Already have a wallet? <a href="/login" class="link-light">Sign in</a>
					</p>
				</div>
			</div>
		{:else}
			<div class="card bp-card">
				<div class="card-header">
					<span class="bp-icon"><i class="bi bi-shield-check text-success"></i></span>
					Save your keys
				</div>
				<div class="card-body">
					<div class="alert alert-warning small">
						<i class="bi bi-exclamation-triangle me-1"></i>
						This is the only time your secret key is displayed. Store it somewhere safe
						<strong>and</strong> remember your PIN. Losing both means losing the account.
					</div>

					<div class="mb-3">
						<div class="small text-white-50 mb-1">Public key</div>
						<div class="bp-key-box d-flex align-items-center gap-2">
							<span class="bp-mono flex-grow-1">{newPublicKey}</span>
							<button
								class="btn btn-sm btn-bp-outline"
								aria-label="Copy public key"
								onclick={() => copy(newPublicKey, "Public key")}
							>
								<i class="bi bi-clipboard"></i>
							</button>
						</div>
					</div>

					<div class="mb-3">
						<div class="small text-warning mb-1">
							<i class="bi bi-shield-lock me-1"></i>Secret key
						</div>
						<div class="bp-key-box d-flex align-items-center gap-2">
							<span class="bp-mono flex-grow-1 text-warning">{newSecretKey}</span>
							<button
								class="btn btn-sm btn-bp-outline"
								aria-label="Copy secret key"
								onclick={() => copy(newSecretKey, "Secret key")}
							>
								<i class="bi bi-clipboard"></i>
							</button>
						</div>
					</div>

					<div class="form-check mb-3">
						<input
							id="ack"
							class="form-check-input"
							type="checkbox"
							bind:checked={acknowledged}
						/>
						<label for="ack" class="form-check-label small">
							I have safely stored my secret key and remember my PIN.
						</label>
					</div>

					<button class="btn btn-bp-primary w-100" onclick={proceed}>
						<i class="bi bi-arrow-right-circle me-2"></i>Continue to dashboard
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if bio}
	<!-- keep `bio` as bound state -->
{/if}
