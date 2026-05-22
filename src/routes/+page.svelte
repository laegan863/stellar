<script lang="ts">
	import { auth } from "$lib/stores/auth.svelte";
</script>

<div class="container py-5">
	<div class="bp-hero text-center">
		<span class="badge rounded-pill bg-primary-subtle text-primary-emphasis mb-3">
			<i class="bi bi-stars me-1"></i>Stellar Testnet
		</span>
		<h1 class="display-3 fw-bold mb-3">Welcome to BasicPay</h1>
		<p class="lead text-white-50 mb-4">
			A minimal Stellar wallet — create a PIN-protected keypair, fund it on Testnet,
			check your balance and send payments, all from your browser.
		</p>
		<div class="d-flex justify-content-center gap-3 flex-wrap">
			{#if auth.isAuthenticated}
				<a class="btn btn-bp-primary btn-lg" href="/dashboard">
					<i class="bi bi-grid me-2"></i>Go to dashboard
				</a>
				<a class="btn btn-bp-outline btn-lg" href="/profile">
					<i class="bi bi-person-circle me-2"></i>My profile
				</a>
			{:else}
				<a class="btn btn-bp-primary btn-lg" href="/register">
					<i class="bi bi-person-plus me-2"></i>Create a wallet
				</a>
				<a class="btn btn-bp-outline btn-lg" href="/login">
					<i class="bi bi-box-arrow-in-right me-2"></i>Sign in
				</a>
			{/if}
		</div>
	</div>

	<div class="row g-4">
		<div class="col-md-4">
			<div class="card bp-card h-100">
				<div class="card-body">
					<span class="bp-icon mb-3"><i class="bi bi-key"></i></span>
					<h5>PIN-protected keys</h5>
					<p class="text-white-50 small mb-0">
						Your Stellar secret is encrypted with your PIN using AES-GCM and stored only in
						your browser.
					</p>
				</div>
			</div>
		</div>
		<div class="col-md-4">
			<div class="card bp-card h-100">
				<div class="card-body">
					<span class="bp-icon mb-3"><i class="bi bi-piggy-bank"></i></span>
					<h5>Friendbot funding</h5>
					<p class="text-white-50 small mb-0">
						Get 10,000 Testnet XLM with one click. Perfect for experimentation and learning.
					</p>
				</div>
			</div>
		</div>
		<div class="col-md-4">
			<div class="card bp-card h-100">
				<div class="card-body">
					<span class="bp-icon mb-3"><i class="bi bi-send"></i></span>
					<h5>Sign & send payments</h5>
					<p class="text-white-50 small mb-0">
						Confirm every transaction with your PIN. New accounts are auto-created using
						<code>createAccount</code>.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
