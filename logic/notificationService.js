import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'earthquake-alerts';
const deliveredEvents = new Set();
let setupPromise = null;
let permissionGranted = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const configureAndroidChannel = async () => {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Eşik Uyarıları',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 300, 300, 300],
    lightColor: '#FFD700',
    sound: 'default',
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
};

export const ensureNotificationSetup = async () => {
  if (setupPromise) {
    await setupPromise;
    return permissionGranted;
  }

  setupPromise = (async () => {
    let { status } = await Notifications.getPermissionsAsync();

    if (status !== 'granted') {
      const request = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      status = request.status;
    }

    permissionGranted = status === 'granted';

    if (permissionGranted) {
      await configureAndroidChannel();
    }
  })();

  await setupPromise;
  return permissionGranted;
};

const recentEnough = (isoTime, windowHours) => {
  if (!isoTime) {
    return true;
  }
  const eventTime = new Date(isoTime).getTime();
  if (Number.isNaN(eventTime)) {
    return true;
  }
  const diff = Date.now() - eventTime;
  return diff <= windowHours * 60 * 60 * 1000;
};

const scheduleNotification = async ({ title, body, data }) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
      androidChannelId: CHANNEL_ID,
    },
    trigger: null,
  });
};

export const evaluateEarthquakeNotifications = async ({
  city,
  events = [],
  threshold = 5,
  windowHours = 24,
}) => {
  const hasPermission = await ensureNotificationSetup();

  if (!hasPermission) {
    return { sent: false, reason: 'permission' };
  }

  const eligible = events.filter(
    (event) =>
      Number(event.magnitude) >= Number(threshold) &&
      recentEnough(event.time, windowHours) &&
      !deliveredEvents.has(event.id)
  );

  await Promise.all(
    eligible.map(async (event) => {
      deliveredEvents.add(event.id);
      await scheduleNotification({
        title: `${city} için ${event.magnitude.toFixed(1)} şiddetinde deprem oldu`,
        body: `${event.location} bölgesinde sarsıntı hissedildi. İyi misin? Durumunu yakınlarınla paylaş.`,
        data: {
          eventId: event.id,
          city,
          magnitude: event.magnitude,
        },
      });
    })
  );

  return { sent: eligible.length > 0, count: eligible.length };
};

export const triggerManualThresholdTest = async ({ city, threshold, events = [] }) => {
  const hasPermission = await ensureNotificationSetup();

  if (!hasPermission) {
    return { sent: false, reason: 'permission' };
  }

  const candidate =
    events.find((event) => Number(event.magnitude) >= Number(threshold)) ||
    [...events].sort((a, b) => Number(b.magnitude) - Number(a.magnitude))[0];

  if (!candidate) {
    return { sent: false, reason: 'missing-data' };
  }

  await scheduleNotification({
    title: `Test Uyarısı · ${city}`,
    body: `${candidate.location} için ${candidate.magnitude.toFixed(1)} şiddetinde sarsıntı simülasyonu. İyi misin?`,
    data: {
      eventId: `${candidate.id}-test`,
      city,
      magnitude: candidate.magnitude,
      test: true,
    },
  });

  return { sent: true };
};

export const resetDeliveredNotifications = () => {
  deliveredEvents.clear();
};
