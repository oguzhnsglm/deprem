import { StackActions } from '@react-navigation/native';

export const computeTabOrder = (routeNames = []) => {
  const mapRoute = routeNames.includes('MapExplorer') ? 'MapExplorer' : 'EarthquakeFeed';
  const desiredOrder = ['Home', mapRoute, 'EarthquakeFeed', 'Profile'];
  return desiredOrder.filter((name, idx) => routeNames.includes(name) && desiredOrder.indexOf(name) === idx);
};

export const getTabTransitionAnimation = (routeNames = [], currentRoute, targetRoute) => {
  const order = computeTabOrder(routeNames);
  const currentIndex = order.indexOf(currentRoute);
  const targetIndex = order.indexOf(targetRoute);
  if (currentIndex === -1 || targetIndex === -1 || currentIndex === targetIndex) {
    return 'slide_from_right';
  }
  return targetIndex > currentIndex ? 'slide_from_right' : 'slide_from_left';
};

export const buildTabNavigationParams = (routeNames = [], currentRoute, targetRoute, params = {}) => ({
  ...params,
  transitionAnimation: getTabTransitionAnimation(routeNames, currentRoute, targetRoute),
});

export const navigateTabRoute = (navigation, routeNames = [], currentRoute, targetRoute, params = {}) => {
  if (currentRoute === targetRoute) {
    return;
  }
  const nextParams = buildTabNavigationParams(routeNames, currentRoute, targetRoute, params);
  navigation.dispatch(StackActions.push(targetRoute, nextParams));
};
