<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth } from "$lib/stores/auth.svelte";
	import { errMsg, toast } from "$lib/stores/toast.svelte";

	let publicKey = $state("");
	let pin = $state("");
	let showPin = $state(false);
	let working = $state(false);

	async function submit(e: Event) {
		e.preventDefault();
		working = true;
		try {
			await auth.login(publicKey, pin);
			toast.success("Welcome back");
			void goto("/dashboard");
		} catch (e) {
			toast.error(errMsg(e));
		} finally {
			working = false;
		}
	}
</script>

<div class="bp-auth-wrap">
	<div class="bp-auth-card">
		<div class="card bp-card">
			<div class="card-header">
				<span class="bp-icon"><i class="bi bi-box-arrow-in-right"></i></span>
				Sign in
			</div>
			<div class="card-body">
				<p class="text-white-50 small mb-4">
					Enter your Stellar public key and the PIN you chose when registering.
				</p>

				<form onsubmit={submit}>
					<div class="mb-3">
						<label for="lpk" class="form-label small">Public key</label>
						<input
							id="lpk"
							type="text"
							class="form-control bp-mono"
							placeholder="G..."
							autocomplete="username"
							bind:value={publicKey}
							required
						/>
					</div>
					<div class="mb-4">
						<label for="lpin" class="form-label small">PIN</label>
						<div class="input-group">
							<input
								id="lpin"
								type={showPin ? "text" : "password"}
								inputmode="numeric"
								autocomplete="current-password"
								class="form-control"
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

					<button class="btn btn-bp-primary w-100" type="submit" disabled={working}>
						{#if working}
							<span class="spinner-border spinner-border-sm me-2"></span>
						{:else}
							<i class="bi bi-unlock me-2"></i>
						{/if}
						Sign in
					</button>
				</form>

				<hr class="my-4 opacity-25" />
				<p class="small text-white-50 text-center mb-0">
					No wallet yet? <a href="/register" class="link-light">Create one</a>
				</p>
			</div>
		</div>
	</div>
</div>
