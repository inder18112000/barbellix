module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@hooks': './src/hooks',
            '@api': './src/api',
            '@store': './src/store',
            '@theme': './src/theme',
            '@utils': './src/utils',
            '@mocks': './src/mocks',
          },
        },
      ],
    ],
  };
};
