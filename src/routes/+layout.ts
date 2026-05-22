// Install the Buffer polyfill before any Stellar SDK code runs.
import "$lib/window";

// Disable pre-rendering of pages during build-time
export const prerender = false;
// Disable server-side rendering (client-only app)
export const ssr = false;
