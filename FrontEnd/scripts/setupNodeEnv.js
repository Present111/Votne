/**
 * html-webpack-plugin copies every property from Node's global object when it
 * evaluates the CRA HTML template. On Node 25 the built-in `localStorage`
 * getter throws unless Node is started with `--localstorage-file`, so the copy
 * step crashes the build with `SecurityError: Cannot initialize local storage`.
 *
 * Removing the getter before react-scripts bootstraps keeps the rest of the
 * toolchain unchanged while still running on newer Node.js releases.
 */
(function stripProblematicGlobals() {
  const keysToRemove = ["localStorage"];

  keysToRemove.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(globalThis, key)) {
      return;
    }

    try {
      // Delete the accessor so downstream code sees `undefined`.
      if (delete globalThis[key]) {
        return;
      }
    } catch (error) {
      // Ignore and fall back to redefining the property below.
    }

    try {
      Object.defineProperty(globalThis, key, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: undefined,
      });
    } catch (error) {
      globalThis[key] = undefined;
    }
  });
})();
