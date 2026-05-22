<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { auth } from "$lib/stores/auth.svelte";
	import { toast } from "$lib/stores/toast.svelte";

	let name = $state("");
	let email = $state("");
	let bio = $state("");
	let editing = $state(false);

	onMount(() => {
		if (!auth.isAuthenticated) {
			toast.info("Please sign in to continue");
			void goto("/login");
			return;
		}
		name = auth.profile.name;
		email = auth.profile.email;
		bio = auth.profile.bio;
	});

	function startEdit() {
		name = auth.profile.name;
		email = auth.profile.email;
		bio = auth.profile.bio;
		editing = true;
	}

	function cancelEdit() {
		editing = false;
	}

	function save(e: Event) {
		e.preventDefault();
		auth.updateProfile({
			name: name.trim(),
			email: email.trim(),
			bio: bio.trim(),
		});
		editing = false;
		toast.success("Profile updated");
	}

	function logout() {
		auth.logout();
		toast.info("Logged out");
		void goto("/login");
	}

	async function copyPk() {
		try {
			await navigator.clipboard.writeText(auth.publicKey);
			toast.success("Public key copied");
		} catch {
			toast.error("Could not copy");
		}
	}
</script>

{#if auth.isAuthenticated}
	<div class="container py-5">
		<div class="bp-hero">
			<h1 class="display-6 fw-bold mb-1">Profile</h1>
			<p class="text-white-50 mb-0">Manage your account information and session.</p>
		</div>

		<div class="row g-4">
			<div class="col-lg-7">
				<div class="card bp-card h-100">
					<div class="card-header">
						<span class="bp-icon"><i class="bi bi-person-circle"></i></span>
						About me
					</div>
					<div class="card-body">
						{#if !editing}
							<dl class="row mb-4">
								<dt class="col-sm-3 text-white-50 small">Name</dt>
								<dd class="col-sm-9">{auth.profile.name || "—"}</dd>

								<dt class="col-sm-3 text-white-50 small">Email</dt>
								<dd class="col-sm-9">{auth.profile.email || "—"}</dd>

								<dt class="col-sm-3 text-white-50 small">Bio</dt>
								<dd class="col-sm-9">{auth.profile.bio || "—"}</dd>
							</dl>
							<button class="btn btn-bp-primary" onclick={startEdit}>
								<i class="bi bi-pencil-square me-2"></i>Edit profile
							</button>
						{:else}
							<form onsubmit={save}>
								<div class="mb-3">
									<label for="pname" class="form-label small">Display name</label>
									<input
										id="pname"
										type="text"
										class="form-control"
										bind:value={name}
									/>
								</div>
								<div class="mb-3">
									<label for="pemail" class="form-label small">Email</label>
									<input
										id="pemail"
										type="email"
										class="form-control"
										bind:value={email}
									/>
								</div>
								<div class="mb-3">
									<label for="pbio" class="form-label small">Bio</label>
									<textarea
										id="pbio"
										rows="3"
										class="form-control"
										bind:value={bio}
									></textarea>
								</div>
								<div class="d-flex gap-2">
									<button type="submit" class="btn btn-bp-primary">
										<i class="bi bi-save me-2"></i>Save
									</button>
									<button
										type="button"
										class="btn btn-bp-outline"
										onclick={cancelEdit}
									>
										Cancel
									</button>
								</div>
							</form>
						{/if}
					</div>
				</div>
			</div>

			<div class="col-lg-5">
				<div class="card bp-card mb-4">
					<div class="card-header">
						<span class="bp-icon"><i class="bi bi-key"></i></span>
						Wallet
					</div>
					<div class="card-body">
						<div class="small text-white-50 mb-1">Public key</div>
						<div class="bp-key-box d-flex align-items-center gap-2 mb-3">
							<span class="bp-mono flex-grow-1">{auth.publicKey}</span>
							<button
								class="btn btn-sm btn-bp-outline"
								aria-label="Copy public key"
								onclick={copyPk}
							>
								<i class="bi bi-clipboard"></i>
							</button>
						</div>
						<p class="small text-white-50 mb-0">
							<i class="bi bi-shield-lock me-1 text-warning"></i>
							Your secret key is encrypted with your PIN and never displayed again.
						</p>
					</div>
				</div>

				<div class="card bp-card">
					<div class="card-header">
						<span class="bp-icon"><i class="bi bi-box-arrow-right"></i></span>
						Session
					</div>
					<div class="card-body">
						<p class="small text-white-50 mb-3">
							Signing out clears your unlocked secret key from memory. You can sign
							back in with your public key and PIN.
						</p>
						<button class="btn btn-bp-outline w-100" onclick={logout}>
							<i class="bi bi-box-arrow-right me-2"></i>Sign out
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
