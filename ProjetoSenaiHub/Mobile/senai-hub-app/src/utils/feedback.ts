import * as Haptics from 'expo-haptics';

async function runHaptic(action: () => Promise<void>) {
  try {
    await action();
  } catch {
    // Haptics may be unavailable on web, simulators, or restricted devices.
  }
}

export function notifySuccess() {
  return runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

export function notifyError() {
  return runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

export function notifySelection() {
  return runHaptic(() => Haptics.selectionAsync());
}
