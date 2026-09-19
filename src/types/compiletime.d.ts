// Available inside compiletime() blocks, which war3-transformer evaluates in Node at build time.
declare const process: { env: Record<string, string | undefined> };
