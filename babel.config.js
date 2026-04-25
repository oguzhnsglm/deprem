module.exports = function (api) {
  api.cache(true);
  const isProduction = process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production';
  const plugins = [
    [
      'transform-inline-environment-variables',
      {
        include: [
          'EXPO_PUBLIC_API_BASE',
        ],
      },
    ],
  ];

  if (isProduction) {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
