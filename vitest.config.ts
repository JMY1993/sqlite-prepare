// import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ["test/**/*.spec.ts"],
		environment: 'node',
		poolOptions: {
			workers: {
				wrangler: { configPath: './wrangler.jsonc' },
				miniflare: {
					kvNamespaces: ["CACHE"],
					d1Databases: ["DB"],
				},
			},
		},
	},
});