<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { Keypair, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
	import {
		fetchAccount,
		fetchAccountBalances,
		fundWithFriendbot,
		HORIZON_URL,
		submit,
	} from "$lib/stellar/horizonQueries";
	import {
		createCreateAccountTransaction,
		createPaymentTransaction,
		NETWORK_PASSPHRASE,
	} from "$lib/stellar/transactions";
	import { auth } from "$lib/stores/auth.svelte";
	import { errMsg, submitErrMsg, toast } from "$lib/stores/toast.svelte";
	import PinModal from "$lib/components/PinModal.svelte";

	type Balance = {
		asset_type: string;
		balance: string;
		asset_code?: string;
		asset_issuer?: string;
	};

	// ---- Route guard --------------------------------------------------------
	onMount(() => {
		if (!auth.isAuthenticated) {
			toast.info("Please sign in to continue");
			void goto("/login");
			return;
		}
		void runLookup();
	});

	// ---- Balance lookup -----------------------------------------------------
	let lookupKey = $state("");
	let lookupBalances = $state<Balance[] | null>(null);
	let lookupLoading = $state(false);
	let lookupNotFound = $state(false);

	$effect(() => {
		if (auth.publicKey && !lookupKey) lookupKey = auth.publicKey;
	});

	async function runLookup() {
		const key = (lookupKey || auth.publicKey).trim();
		if (!StrKey.isValidEd25519PublicKey(key)) return toast.error("Invalid public key");
		lookupLoading = true;
		lookupBalances = null;
		lookupNotFound = false;
		try {
			const bals = (await fetchAccountBalances(key)) as Balance[];
			if (bals.length === 0) lookupNotFound = true;
			else lookupBalances = bals;
		} catch (e) {
			toast.error(errMsg(e));
		} finally {
			lookupLoading = false;
		}
	}

	function lookupMyAccount() {
		lookupKey = auth.publicKey;
		void runLookup();
	}

	// ---- Fund (dynamic) -----------------------------------------------------
	let fundKey = $state("");
	let funding = $state(false);

	$effect(() => {
		if (auth.publicKey && !fundKey) fundKey = auth.publicKey;
	});

	async function fundAccount() {
		const key = fundKey.trim();
		if (!StrKey.isValidEd25519PublicKey(key)) return toast.error("Invalid public key");
		funding = true;
		try {
			await fundWithFriendbot(key);
			toast.success(`Funded ${short(key)} with 10,000 XLM`);
			if (key === lookupKey.trim() || key === auth.publicKey) await runLookup();
		} catch (e) {
			toast.error(errMsg(e));
		} finally {
			funding = false;
		}
	}

	// ---- Transfer -----------------------------------------------------------
	let destination = $state("");
	let amount = $state("10");
	let memo = $state("");
	let sending = $state(false);
	let txHash = $state("");

	let pinModalOpen = $state(false);
	let pendingTx = $state<{ xdr: string; network_passphrase: string } | null>(null);
	let pendingIsCreateAccount = $state(false);

	async function reviewTransfer(e: Event) {
		e.preventDefault();
		const dest = destination.trim();
		if (!StrKey.isValidEd25519PublicKey(dest)) return toast.error("Invalid destination key");
		if (!amount || Number(amount) <= 0) return toast.error("Enter a positive amount");
		if (dest === auth.publicKey) return toast.error("Destination cannot be yourself");

		sending = true;
		txHash = "";
		try {
			let useCreateAccount = false;
			try {
				await fetchAccount(dest);
			} catch (e: unknown) {
				const status404 =
					typeof e === "object" &&
					e !== null &&
					"response" in e &&
					(e as { response?: { status?: number } }).response?.status === 404;
				if (status404) useCreateAccount = true;
				else throw e;
			}

			if (useCreateAccount && Number(amount) < 1) {
				throw new Error("Destination is unfunded — minimum starting balance is 1 XLM");
			}

			pendingIsCreateAccount = useCreateAccount;
			const built = useCreateAccount
				? await createCreateAccountTransaction({
						source: auth.publicKey,
						destination: dest,
						amount,
						memo,
					})
				: await createPaymentTransaction({
						source: auth.publicKey,
						destination: dest,
						asset: "native",
						amount,
						memo,
					});
			pendingTx = { xdr: built.transaction, network_passphrase: built.network_passphrase };

			pinModalOpen = true;
		} catch (e) {
			toast.error(submitErrMsg(e));
		} finally {
			sending = false;
		}
	}

	async function confirmAndSend(secret: string) {
		if (!pendingTx) return;
		pinModalOpen = false;
		sending = true;
		try {
			const tx = TransactionBuilder.fromXDR(pendingTx.xdr, pendingTx.network_passphrase);
			tx.sign(Keypair.fromSecret(secret));
			const result = await submit(tx.toXDR(), pendingTx.network_passphrase);
			txHash = result.hash;
			toast.success(pendingIsCreateAccount ? "Account created & funded" : "Payment sent");
			destination = "";
			memo = "";
			pendingTx = null;
			await runLookup();
		} catch (e) {
			toast.error(submitErrMsg(e));
		} finally {
			sending = false;
		}
	}

	function cancelPin() {
		pinModalOpen = false;
		pendingTx = null;
	}

	// ---- Helpers ------------------------------------------------------------
	function short(k: string) {
		return k.length > 14 ? `${k.slice(0, 6)}…${k.slice(-6)}` : k;
	}
</script>

{#if auth.isAuthenticated}
	<div class="container py-5">
		<div class="bp-hero">
			<div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
				<div>
					<span class="badge rounded-pill bg-primary-subtle text-primary-emphasis mb-2">
						<i class="bi bi-person-check me-1"></i>
						Signed in as {auth.profile.name || "you"}
					</span>
					<h1 class="display-6 fw-bold mb-1">Dashboard</h1>
					<p class="text-white-50 mb-0 bp-mono small">{auth.publicKey}</p>
				</div>
				<div class="text-end small text-white-50">
					<i class="bi bi-broadcast me-1"></i>{HORIZON_URL}
				</div>
			</div>
		</div>

		<div class="row g-4">
			<!-- ===== Check balance ===== -->
			<div class="col-lg-6">
				<div class="card bp-card h-100">
					<div class="card-header">
						<span class="bp-icon"><i class="bi bi-search"></i></span>
						Check balance
					</div>
					<div class="card-body">
						<p class="form-text mb-3">
							Defaults to your account; you can also inspect any other Testnet account.
						</p>
						<label for="lookup" class="form-label small">Public key</label>
						<input
							id="lookup"
							type="text"
							class="form-control bp-mono mb-3"
							placeholder="G..."
							bind:value={lookupKey}
						/>
						<div class="d-flex gap-2 flex-wrap">
							<button
								class="btn btn-bp-primary"
								disabled={lookupLoading || !lookupKey}
								onclick={runLookup}
							>
								{#if lookupLoading}
									<span class="spinner-border spinner-border-sm me-2"></span>
								{:else}
									<i class="bi bi-eye me-2"></i>
								{/if}
								Check balance
							</button>
							<button class="btn btn-bp-outline" onclick={lookupMyAccount}>
								<i class="bi bi-person me-1"></i>My account
							</button>
						</div>

						{#if lookupNotFound}
							<div class="alert alert-warning mt-4 mb-0 small">
								<i class="bi bi-exclamation-triangle me-1"></i>
								Account <code class="bp-mono">{short(lookupKey)}</code> is not funded
								on Testnet yet.
							</div>
						{:else if lookupBalances}
							<div class="row g-3 mt-1">
								{#each lookupBalances as b}
									<div class="col-sm-6">
										<div class="bp-balance-tile h-100">
											<div class="label">
												{b.asset_type === "native"
													? "XLM (native)"
													: b.asset_code}
											</div>
											<div class="value">
												{Number(b.balance).toLocaleString()}
											</div>
											{#if b.asset_issuer}
												<div class="bp-mono small text-white-50 mt-1">
													{short(b.asset_issuer)}
												</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- ===== Add funds (dynamic) ===== -->
			<div class="col-lg-6">
				<div class="card bp-card h-100">
					<div class="card-header">
						<span class="bp-icon"><i class="bi bi-coin"></i></span>
						Add funds
					</div>
					<div class="card-body">
						<p class="form-text mb-3">
							Paste any public key to fund it with 10,000 Testnet XLM via Friendbot.
							Each public key can only be funded once.
						</p>
						<label for="fund" class="form-label small">Public key to fund</label>
						<input
							id="fund"
							type="text"
							class="form-control bp-mono mb-3"
							placeholder="G..."
							bind:value={fundKey}
						/>
						<div class="d-flex gap-2 flex-wrap">
							<button
								class="btn btn-bp-primary"
								disabled={funding || !fundKey}
								onclick={fundAccount}
							>
								{#if funding}
									<span class="spinner-border spinner-border-sm me-2"></span>
								{:else}
									<i class="bi bi-cloud-arrow-down me-2"></i>
								{/if}
								Fund with Friendbot
							</button>
							{#if fundKey !== auth.publicKey}
								<button
									class="btn btn-bp-outline"
									onclick={() => (fundKey = auth.publicKey)}
								>
									<i class="bi bi-person me-1"></i>Use my key
								</button>
							{/if}
							{#if fundKey}
								<button class="btn btn-bp-outline" onclick={() => (fundKey = "")}>
									<i class="bi bi-x-lg me-1"></i>Clear
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>

			<!-- ===== Transfer ===== -->
			<div class="col-12">
				<div class="card bp-card">
					<div class="card-header">
						<span class="bp-icon"><i class="bi bi-send"></i></span>
						Transfer funds
					</div>
					<div class="card-body">
						<p class="form-text mb-3">
							Funds are deducted from your signed-in account. If the destination
							doesn't exist yet, a <code>createAccount</code> operation is used (min 1
							XLM).
						</p>

						<form onsubmit={reviewTransfer}>
							<div class="row g-3">
								<div class="col-md-7">
									<label for="dest" class="form-label small">
										Destination public key
									</label>
									<input
										id="dest"
										type="text"
										class="form-control bp-mono"
										placeholder="G..."
										bind:value={destination}
										required
									/>
								</div>
								<div class="col-md-2">
									<label for="amt" class="form-label small">Amount (XLM)</label>
									<input
										id="amt"
										type="number"
										min="0"
										step="0.0000001"
										class="form-control"
										bind:value={amount}
										required
									/>
								</div>
								<div class="col-md-3">
									<label for="memo" class="form-label small">Memo (optional)</label>
									<input
										id="memo"
										type="text"
										maxlength="28"
										class="form-control"
										placeholder="up to 28 chars"
										bind:value={memo}
									/>
								</div>
							</div>

							<button
								class="btn btn-bp-primary mt-3"
								type="submit"
								disabled={sending || !destination || !amount}
							>
								{#if sending}
									<span class="spinner-border spinner-border-sm me-2"></span>
								{:else}
									<i class="bi bi-lightning-charge me-2"></i>
								{/if}
								Review &amp; sign
							</button>
						</form>

						{#if txHash}
							<div class="alert alert-success mt-3 mb-0 small">
								<div class="fw-semibold mb-1">
									<i class="bi bi-check-circle me-1"></i>Transaction confirmed
								</div>
								<a
									class="link-light bp-mono"
									href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
									target="_blank"
									rel="noreferrer"
								>
									{txHash}
								</a>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<footer class="text-center text-white-50 small mt-5">
			Network: <span class="bp-mono">{NETWORK_PASSPHRASE}</span>
		</footer>
	</div>

	<PinModal
		open={pinModalOpen}
		title="Transaction preview"
		description="Please confirm the transaction below in order to sign and submit it to the network."
		confirmLabel="Sign &amp; submit"
		tx={pendingTx}
		onConfirm={confirmAndSend}
		onCancel={cancelPin}
	/>
{/if}
