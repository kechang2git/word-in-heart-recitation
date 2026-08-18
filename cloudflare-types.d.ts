declare module "cloudflare:workers" { export const env: { DB?: D1Database }; }
interface Fetcher { fetch(input: Request): Promise<Response>; }
interface D1Database { prepare(query: string): unknown; }
