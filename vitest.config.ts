import { defineConfig } from "vitest/config";
import path from "node:path";

const root = __dirname;

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "packages/3d-core/src/reducer.test.ts",
      "packages/history/src/history-manager.test.ts",
      "packages/collab/src/room-state.test.ts"
    ]
  },
  resolve: {
    alias: {
      "@figma-3d/shared": path.resolve(root, "packages/shared/src/index.ts"),
      "@figma-3d/3d-core": path.resolve(root, "packages/3d-core/src/index.ts"),
      "@figma-3d/collab": path.resolve(root, "packages/collab/src/index.ts"),
      "@figma-3d/history": path.resolve(root, "packages/history/src/index.ts"),
      "@figma-3d/protocol": path.resolve(root, "packages/protocol/src/index.ts")
    }
  }
});
