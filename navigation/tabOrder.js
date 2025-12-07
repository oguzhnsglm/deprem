export const computeTabOrder = (routeNames = []) => {
  const mapRoute = routeNames.includes('MapExplorer') ? 'MapExplorer' : 'EarthquakeFeed';
  const desiredOrder = ['Home', mapRoute, 'EarthquakeFeed', 'Profile'];
  return desiredOrder.filter((name, idx) => routeNames.includes(name) && desiredOrder.indexOf(name) === idx);
};
