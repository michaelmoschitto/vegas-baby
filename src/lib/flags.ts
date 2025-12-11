import { createHypertuneAdapter } from "@flags-sdk/hypertune";
import { Identify } from "flags";
import { dedupe, flag } from "flags/next";

import {
  createSource,
  flagFallbacks,
  vercelFlagDefinitions as flagDefinitions,
  Context,
  RootFlagValues,
} from "../../generated/hypertune";

const identify: Identify<Context> = dedupe(async ({ headers, cookies }) => {
  return {
    environment: process.env.NODE_ENV as "development" | "production" | "test",
    user: { id: "1", name: "Test User", email: "hi@test.com" },
  };
});

const hypertuneAdapter = createHypertuneAdapter<RootFlagValues, Context>({
  createSource,
  flagFallbacks,
  flagDefinitions,
  identify,
});

export const enableCardScanningFlag = flag(
  hypertuneAdapter.declarations.enableCardScanning
);
