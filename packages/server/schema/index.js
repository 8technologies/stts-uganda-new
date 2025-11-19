import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { loadFiles } from "@graphql-tools/load-files";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// helper to make a POSIX glob on Windows
const toPosix = (p) => p.split(path.sep).join("/");

async function main() {
  const base = toPosix(__dirname);

  // Build POSIX-style globs so globbing works cross-platform
  const typeDefsGlob   = `${base}/**/typeDefs.js`;
  const resolversGlob  = `${base}/**/resolvers.js`;

  // Force load-files to import via file:// URLs on Windows
  const opts = {
    requireMethod: async (p) => import(pathToFileURL(p).href),
  };

  const typeDefsArray  = await loadFiles(typeDefsGlob, opts);
  const resolversArray = await loadFiles(resolversGlob, opts);

  return { typeDefsArray, resolversArray };
}

const { typeDefsArray, resolversArray } = await main();

export const typeDefs  = mergeTypeDefs(typeDefsArray);
export const resolvers = mergeResolvers(resolversArray);

// If you want the executable schema:
// export const schema = makeExecutableSchema({ typeDefs, resolvers });
