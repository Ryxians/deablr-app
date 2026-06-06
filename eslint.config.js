//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"
import eslintPluginReactYouMightNotNeedAnEffect from "eslint-plugin-react-you-might-not-need-an-effect"

export default [
  { ignores: [".output", "node_modules", "dist"] },
  ...tanstackConfig,
  eslintPluginReactYouMightNotNeedAnEffect.configs.recommended,
]
