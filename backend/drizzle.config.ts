import { defineConfig } from "drizzle-kit"
import * as env from './src/libs/env'

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: env.str('DATABASE_URL')
  }
});