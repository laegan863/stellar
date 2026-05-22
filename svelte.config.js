import preprocess from "svelte-preprocess";
import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // Note: Your `adapter` configuration may need customizations depending
    // on how you are building and deploying your application.
    adapter: adapter({
      fallback: "index.html",
    }),
  },
  preprocess: [
    preprocess({
      postcss: true,
    }),
  ],
};

export default config;