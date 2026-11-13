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
      title: "StatusTracker 3",
      htmlAttrs: {
        lang: "en",
      },
    },
  },
  css: ["~/assets/style.css"],

  nitro: {
    compressPublicAssets: true,
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      "* * * * *": ["updateCount", "webhooks"],
    },
  },

  runtimeConfig: {
    public: {
      clientVersion: pkg.version,
    },
  },

  components: ["~/sections", "~/components"],
  modules: nuxtEslintExists ? ["@nuxt/eslint"] : [],
});
