<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import { auth } from "$lib/stores/auth.svelte";
	import { toast } from "$lib/stores/toast.svelte";

	function short(k: string) {
		return k.length > 14 ? `${k.slice(0, 6)}…${k.slice(-6)}` : k;
	}

	function logout() {
		auth.logout();
		toast.info("Logged out");
		void goto("/login");
	}

	function isActive(path: string) {
		return page.url.pathname === path ? "active" : "";
	}
</script>

<nav class="navbar navbar-expand-lg bp-navbar sticky-top">
	<div class="container">
		<a class="navbar-brand fw-bold" href="/">
			<i class="bi bi-stars text-primary me-2"></i>Team Bacolod!
		</a>

		<button
			class="navbar-toggler"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#bpNav"
			aria-controls="bpNav"
			aria-expanded="false"
			aria-label="Toggle navigation"
		>
			<span class="navbar-toggler-icon"></span>
		</button>

		<div id="bpNav" class="collapse navbar-collapse">
			<ul class="navbar-nav ms-auto align-items-lg-center gap-lg-2">
				{#if auth.isAuthenticated}
					<li class="nav-item">
						<a class="nav-link {isActive('/dashboard')}" href="/dashboard">
							<i class="bi bi-grid me-1"></i>Dashboard
						</a>
					</li>
					<li class="nav-item">
						<a class="nav-link {isActive('/profile')}" href="/profile">
							<i class="bi bi-person-circle me-1"></i>Profile
						</a>
					</li>
					<li class="nav-item">
						<span class="badge bg-primary-subtle text-primary-emphasis bp-mono">
							{short(auth.publicKey)}
						</span>
					</li>
					<li class="nav-item">
						<button class="btn btn-sm btn-bp-outline ms-lg-2" onclick={logout}>
							<i class="bi bi-box-arrow-right me-1"></i>Logout
						</button>
					</li>
				{:else}
					<li class="nav-item">
						<a class="nav-link {isActive('/login')}" href="/login">Sign in</a>
					</li>
					<li class="nav-item">
						<a class="btn btn-bp-primary btn-sm ms-lg-2" href="/register">
							<i class="bi bi-person-plus me-1"></i>Create wallet
						</a>
					</li>
				{/if}
			</ul>
		</div>
	</div>
</nav>
