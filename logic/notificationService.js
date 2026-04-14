// Push notification desteği kaldırıldı (expo-notifications SDK 53 Expo Go uyumsuzluğu).
// WhatsApp paylaşımı AlertScreen üzerinden yapılmaktadır.

export const ensureNotificationSetup = async () => false;
export const evaluateEarthquakeNotifications = async () => ({ sent: false, reason: 'disabled' });
export const triggerManualThresholdTest = async () => ({ sent: false, reason: 'disabled' });
export const resetDeliveredNotifications = () => {};
