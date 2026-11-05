/** Registers the TypeScript resolve hook for a `node` run. */
import { register } from 'node:module';
register('./ts-resolve-hook.mjs', import.meta.url);
