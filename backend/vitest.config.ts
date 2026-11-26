import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // vitest 4 no longer skips dist/, which an older build may have left compiled tests in
    dir: 'src',
  },
})
