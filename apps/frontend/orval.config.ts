import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "../backend/openapi.json",
    output: {
      target: "./src/api/generated/client.ts",
      schemas: "./src/api/generated/model",
      client: "axios",
      mode: "split",
      clean: true,
      prettier: true,
      override: {
        mutator: {
          path: "./src/api/custom-instance.ts",
          name: "customInstance",
        },
        zod: {
          generate: {
            body: true,
            param: true,
            query: true,
            response: true,
          },
        },
      },
    },
  },
  zod: {
    input: "../backend/openapi.json",
    output: {
      target: "./src/api/generated/zod.ts",
      client: "zod",
      mode: "single",
      clean: false,
      prettier: true,
    },
  },
});
