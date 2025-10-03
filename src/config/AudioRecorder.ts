import { NativeModules, NativeEventEmitter } from 'react-native';
const { AudioRecorder } = NativeModules;

const emitter = new NativeEventEmitter(AudioRecorder);
/**
 * Audio recording service interface
 */
export default {
  start: () => AudioRecorder.startRecording(),
  pause: () => AudioRecorder.pauseRecording(),
  resume: () => AudioRecorder.resumeRecording(),
  stop: () => AudioRecorder.stopRecording(),
  addListener: (event: string, cb: (data: unknown) => void) =>
    emitter.addListener(event, cb),
  trim: (filePath: string, startSec: number, endSec: number) =>
    AudioRecorder.trimRecording(filePath, startSec, endSec),
  shareFile: (filePath: string, mimeType: string) =>
    AudioRecorder.shareFile(filePath, mimeType),
};
