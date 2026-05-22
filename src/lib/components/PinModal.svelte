<script lang="ts">
	import { TransactionBuilder } from "@stellar/stellar-sdk";
	import { auth } from "$lib/stores/auth.svelte";

	type TxInfo = { xdr: string; network_passphrase: string };

	type Props = {
		open: boolean;
		title?: string;
		description?: string;
		confirmLabel?: string;
		/** Optional transaction to preview before asking for PIN. */
		tx?: TxInfo | null;
		onConfirm: (secret: string) => void | Promise<void>;
		onCancel: () => void;
	};

	let {
		open,
		title = "Confirm with PIN",
		description = "Re-enter your wallet PIN to authorize this action.",
		confirmLabel = "Confirm",
		tx = null,
		onConfirm,
		onCancel,
	}: Props = $props();

	let pin = $state("");
	let working = $state(false);
	let error = $state("");

	$effect(() => {
		if (!open) {
			pin = "";
			error = "";
			working = false;
		}
	});

	type Parsed = {
		networkPassphrase: string;
		source: string;
		sequence: string;
		fee: string;
		memoType: string;
		memoValue: string | null;
		operations: Array<Record<string, unknown> & { type: string }>;
		xdr: string;
	};

	const parsed = $derived.by<Parsed | null>(() => {
		if (!tx) return null;
		try {
			const t = TransactionBuilder.fromXDR(tx.xdr, tx.network_passphrase);
			const c = t as unknown as {
				source: string;
				sequence: string;
				fee: string;
				memo: { type: string; value?: string | Buffer };
				operations: Array<Record<string, unknown> & { type: string }>;
			};
			let memoValue: string | null = null;
			if (c.memo && c.memo.type !== "none") {
				memoValue =
					typeof c.memo.value === "string"
						? c.memo.value
						: c.memo.value
							? c.memo.value.toString()
							: null;
			}
			return {
				networkPassphrase: tx.network_passphrase,
				source: c.source,
				sequence: c.sequence,
				fee: c.fee,
				memoType: c.memo?.type ?? "none",
				memoValue,
				operations: c.operations,
				xdr: tx.xdr,
			};
		} catch {
			return null;
		}
	});

	async function submit(e: Event) {
		e.preventDefault();
		if (!pin) {
			error = "Enter your PIN";
			return;
		}
		working = true;
		error = "";
		try {
			const secret = await auth.unlockSecret(pin);
			await onConfirm(secret);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			working = false;
		}
	}

	async function copyXdr() {
		if (parsed?.xdr) await navigator.clipboard.writeText(parsed.xdr);
	}

	function fmtAsset(op: Record<string, unknown>): string {
		const a = op["asset"] as { code?: string; issuer?: string } | undefined;
		if (!a) return "";
		if (!a.issuer) return "XLM (native)";
		return `${a.code}:${a.issuer}`;
	}
</script>

{#if open}
	<div
		class="modal-backdrop fade show"
		role="presentation"
		onclick={onCancel}
		onkeydown={(e) => e.key === "Escape" && onCancel()}
	></div>
	<div class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
		<div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
			<div class="modal-content bp-card">
				<form onsubmit={submit}>
					<div class="modal-header border-0">
						<h5 class="modal-title">
							<i class="bi bi-shield-lock text-warning me-2"></i>{title}
						</h5>
						<button
							type="button"
							class="btn-close btn-close-white"
							aria-label="Close"
							onclick={onCancel}
						></button>
					</div>
					<div class="modal-body">
						<p class="text-white-50 small mb-3">{description}</p>

						{#if parsed}
							<div class="bp-tx-section">
								<h6 class="bp-tx-heading">Transaction details</h6>
								<dl class="row gx-3 gy-2 mb-0 small">
									<dt class="col-sm-4 text-white-50">Network</dt>
									<dd class="col-sm-8">
										<code class="bp-chip">{parsed.networkPassphrase}</code>
									</dd>

									<dt class="col-sm-4 text-white-50">Source</dt>
									<dd class="col-sm-8">
										<code class="bp-chip bp-mono">{parsed.source}</code>
									</dd>

									<dt class="col-sm-4 text-white-50">Sequence number</dt>
									<dd class="col-sm-8">
										<code class="bp-chip">{parsed.sequence}</code>
									</dd>

									<dt class="col-sm-4 text-white-50">Fee</dt>
									<dd class="col-sm-8">
										<code class="bp-chip">{parsed.fee}</code>
										<span class="text-white-50">stroops</span>
									</dd>

									<dt class="col-sm-4 text-white-50">
										Memo ({parsed.memoType})
									</dt>
									<dd class="col-sm-8">
										<code class="bp-chip">{parsed.memoValue ?? "null"}</code>
									</dd>
								</dl>
							</div>

							<div class="bp-tx-section">
								<h6 class="bp-tx-heading">Operations</h6>
								<ol class="ps-3 mb-0">
									{#each parsed.operations as op, i}
										<li class="mb-2">
											<div class="small fw-semibold">Operation {i}</div>
											<ul class="list-unstyled small mb-0 ms-3">
												<li>
													type:
													<code class="bp-chip">{op.type}</code>
												</li>
												{#if "destination" in op}
													<li>
														destination:
														<code class="bp-chip bp-mono">
															{String(op.destination)}
														</code>
													</li>
												{/if}
												{#if "amount" in op}
													<li>
														amount:
														<code class="bp-chip">{String(op.amount)}</code>
													</li>
												{/if}
												{#if "startingBalance" in op}
													<li>
														starting balance:
														<code class="bp-chip">
															{String(op.startingBalance)}
														</code>
													</li>
												{/if}
												{#if "asset" in op}
													<li>
														asset:
														<code class="bp-chip">{fmtAsset(op)}</code>
													</li>
												{/if}
											</ul>
										</li>
									{/each}
								</ol>
							</div>

							<div class="bp-tx-section">
								<div class="d-flex align-items-center justify-content-between mb-2">
									<h6 class="bp-tx-heading mb-0">Transaction XDR</h6>
									<button
										type="button"
										class="btn btn-sm btn-bp-outline"
										aria-label="Copy XDR"
										onclick={copyXdr}
									>
										<i class="bi bi-clipboard me-1"></i>Copy
									</button>
								</div>
								<p class="small text-white-50 mb-2">
									Unsigned XDR — you can verify it on the
									<a
										class="link-light"
										href="https://laboratory.stellar.org/#xdr-viewer?network=test"
										target="_blank"
										rel="noreferrer">Stellar Laboratory</a
									>.
								</p>
								<div class="bp-xdr-box bp-mono small">{parsed.xdr}</div>
							</div>
						{/if}

						<div class="mt-3">
							<label for="pinModalInput" class="form-label small">
								Confirm with PIN
							</label>
							<input
								id="pinModalInput"
								type="password"
								inputmode="numeric"
								autocomplete="current-password"
								class="form-control"
								bind:value={pin}
							/>
							{#if error}
								<div class="alert alert-danger mt-3 mb-0 py-2 small">
									<i class="bi bi-exclamation-triangle me-1"></i>{error}
								</div>
							{/if}
						</div>
					</div>
					<div class="modal-footer border-0">
						<button
							type="button"
							class="btn btn-bp-outline"
							onclick={onCancel}
							disabled={working}
						>
							Cancel
						</button>
						<button type="submit" class="btn btn-bp-primary" disabled={working || !pin}>
							{#if working}
								<span class="spinner-border spinner-border-sm me-2"></span>
							{:else}
								<i class="bi bi-check2-circle me-2"></i>
							{/if}
							{confirmLabel}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
