<script lang="ts">
	import "../app.css";
	import { onMount } from "svelte";
	import favicon from "$lib/assets/favicon.svg";
	import Navbar from "$lib/components/Navbar.svelte";
	import Toasts from "$lib/components/Toasts.svelte";

	let { children } = $props();

	onMount(async () => {
		// Bootstrap's JS bundle is needed for the navbar collapse toggle.
		// @ts-expect-error - no types shipped for the prebuilt bundle file
		await import("bootstrap/dist/js/bootstrap.bundle.min.js");
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>BasicPay</title>
</svelte:head>

<Navbar />

{@render children()}

<Toasts />
