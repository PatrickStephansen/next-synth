const CopyWebpackPlugin = require("copy-webpack-plugin");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, _) => {
    config.plugins = [
      ...config.plugins,
      new CopyWebpackPlugin({
        patterns: [
          // {
          //   from: "node_modules/reactive-synth-bitcrusher/bitcrusher.js",
          //   to: "../public/worklets",
          // },
          // {
          //   from: "node_modules/reactive-synth-bitcrusher/reactive_synth_bitcrusher.wasm",
          //   to: "../public/worklets",
          // },
          {
            from: "node_modules/reactive-synth-envelope-generator/envelope-generator.js",
            to: "../public/worklets",
          },
          {
            from: "node_modules/reactive-synth-envelope-generator/reactive_synth_envelope_generator.wasm",
            to: "../public/worklets",
          },
        ],
      }),
    ];
    return config;
  },
};

module.exports = nextConfig;
