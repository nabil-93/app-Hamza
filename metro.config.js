const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Allow Metro to resolve .cjs files
config.resolver.sourceExts.push("cjs");

// Block native-only packages from web build
config.resolver.blockList = [
  /node_modules\/react-native-screens\/.*\.(native)\.(js|ts|tsx)$/,
];

module.exports = withNativeWind(config, { input: "./global.css" });
