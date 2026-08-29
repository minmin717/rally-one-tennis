import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  root:resolve(__dirname,"static-app"),
  base:"/rally-one-tennis/",
  plugins:[react()],
  publicDir:resolve(__dirname,"public"),
  build:{outDir:resolve(__dirname,"docs"),emptyOutDir:true},
});
