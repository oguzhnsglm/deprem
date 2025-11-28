module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'transform-inline-environment-variables',
        {
          include: [
            'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
            'EXPO_PUBLIC_OPENAI_API_KEY',
            'EXPO_PUBLIC_GEMINI_API_KEY',
            'EXPO_PUBLIC_SAFE_SPOT_MODEL',
            'EXPO_PUBLIC_SAFE_SPOT_PROVIDER',
            'EXPO_PUBLIC_VS30_API_BASE',
          ],
        },
      ],
    ],
  };
};
