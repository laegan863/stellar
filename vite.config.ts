import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		// Some Stellar SDK transitive deps reference `global` (Node) at module
		// scope. Map it to `globalThis` so they work in the browser.
		global: "globalThis",
	},
	ssr: {
		noExternal: [
			"@creit.tech/stellar-wallets-kit",
			"@stellar/freighter-api",
			"@lobstrco/signer-extension-api",
		],
	},
});
