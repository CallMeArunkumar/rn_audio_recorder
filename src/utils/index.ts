import { Alert, Linking, Platform } from 'react-native';
import { RecorderState } from '../types';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

/**
 * Formats seconds into MM:SS format
 * @param sec Number of seconds
 * @returns
 */
export const formatMMSS = (sec: number) => {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
};

/**
 * Sanitize file name by replacing forbidden characters
 * @param name File name to sanitize (forbidden chars replaced with _)
 * @returns
 */
export const sanitizeFileName = (name: string) => name.replace(/[:/\\, ]/g, '_');

/**
 * Get mic button label based on recorder state
 * @param state Recorder state
 * @returns Mic button label
 */
export const micLabel = (state: RecorderState) =>
  state === 'idle' ? 'Start' : state === 'recording' ? 'Pause' : 'Resume';

/**
 * Get play button label based on recorder state
 * @param state Recorder state
 * @returns Play button label
 */
export const playLabel = (state: RecorderState) =>
  state === 'playing' ? 'Pause' : 'Play';

/**
 * Check and request microphone permission
 * @returns 
 */
export const checkMicrophonePermission = async (): Promise<boolean> => {
  try {
    const permission =
      Platform.OS === 'android'
        ? PERMISSIONS.ANDROID.RECORD_AUDIO
        : PERMISSIONS.IOS.MICROPHONE;

    const result = await check(permission);

    if (result === RESULTS.GRANTED) return true;

    const reqResult = await request(permission);
    if (reqResult === RESULTS.GRANTED) return true;

    // If still not granted, show alert with "Go to Settings"
    Alert.alert(
      'Permission Required',
      'Microphone access is required to record audio.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => Linking.openSettings()
        },
      ],
    );

    return false;
  } catch (e) {
    console.warn('Permission check error:', e);
    return false;
  }
};