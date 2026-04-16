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
            'EXPO_PUBLIC_VS30_API_BASE',
            'EXPO_PUBLIC_MAP_API_BASE',
            'EXPO_PUBLIC_FAULT_API_BASE',
            'EXPO_PUBLIC_MAP_FETCH_TIMEOUT_MS',
            'EXPO_PUBLIC_API_BASE',
          ],
        },
      ],
    ],
  };
};
