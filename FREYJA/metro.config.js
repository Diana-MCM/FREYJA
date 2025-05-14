
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;
=======
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleImport, platform) => {
  // Always import the ESM version of all `@firebase/*` packages
  if (moduleImport.startsWith('@firebase/')) {
    return context.resolveRequest(
      {
        ...context,
        isESMImport: true, // Mark the import method as ESM
      },
      moduleImport,
      platform
    );
  }

  return context.resolveRequest(context, moduleImport, platform);
};

module.exports = config;