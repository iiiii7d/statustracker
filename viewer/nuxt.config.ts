import pkg from "./package.json";

let nuxtEslintExists = true;
try {
  await import("@nuxt/eslint");
} catch {
  nuxtEslintExists = false;
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2026-07-01",
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  app: {
    head: {
      title: "StatusTracker 4",
      htmlAttrs: {
        lang: "en",
      },
    },
  },
  css: ["~/assets/style.css"],
  icon: {
    clientBundle: {
      scan: true,
    },
  },

  nitro: {
    compressPublicAssets: true,
  },

  runtimeConfig: {
    public: {
      clientVersion: pkg.version,
    },
  },

  components: ["~/components"],
  modules: [
    "@nuxt/ui",
    "@vueuse/nuxt",
    ...(nuxtEslintExists ? ["@nuxt/eslint"] : []),
  ],
});
