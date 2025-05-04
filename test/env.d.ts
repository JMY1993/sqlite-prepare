/// <reference types="../src/types/d1-types" />

declare namespace Cloudflare {
	interface Env {DB: D1Database;}
}

interface CloudflareBindings extends Cloudflare.Env {}

declare module "cloudflare:test" {
    interface ProvidedEnv extends CloudflareBindings {
        DB: D1Database;
    }
}