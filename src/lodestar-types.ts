export let lodestar

// these libs are ESM only and typescript doesn't yet have great support for that when you
// want to compile to commonjs. the only way I've found to get typescript to not compile a dynamic
// import is to use eval.
export async function getLodestarTypes() {
  lodestar = await eval("import('@lodestar/types')") as Promise<typeof import('@lodestar/types')>
}