// Stand-in for Node built-ins (fs, path, crypto) that some WebAssembly loaders
// reference in their Node-only code paths. Never called in the browser.
const empty = {};
export default empty;
