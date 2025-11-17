import { defineConfig } from "vite";

export default defineConfig({
  base: "/client_side_vite_template/",
  assetsInclude: ["**/*.wasm"], 
  build: {
    outDir: "dist",
    emptyOutDir: true,
    commonjsOptions: { transformMixedEsModules: true },
  },
});