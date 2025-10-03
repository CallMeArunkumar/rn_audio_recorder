import { Animated } from "react-native";

/**
 * Types used in the app
 */
export type RecorderState =
  | 'idle'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'playing'
  | 'playPaused';
/**
 * A recorded audio item
 */
export type RecordingItem = {
  id: string;
  filePath: string;
  duration: number; // seconds
  createdAt: number;
  name?: string;
};

/**
 * Props for HistoryModal component
 */
export type HistoryModalProps = {
  visible: boolean;
  recordings: RecordingItem[];
  state: 'idle' | 'recording' | 'paused' | 'stopped' | 'playing' | 'playPaused';
  currentPlayingId: string | null;
  onClose: () => void;
  handlePlayPause: (filePath?: string, id?: string) => void;
  trimRecording: (id: string) => void;
  saveRecording: (id: string) => void;
  deleteRecording: (id: string) => void;
};

/**
 * Props for RecordingRow component
 */
export type RecordingRowProps = {
  item: RecordingItem;
  state: 'idle' | 'recording' | 'paused' | 'stopped' | 'playing' | 'playPaused';
  currentPlayingId: string | null;
  handlePlayPause: (filePath?: string, id?: string) => void;
  trimRecording: (id: string) => void;
  saveRecording: (id: string) => void;
  deleteRecording: (id: string) => void;
};

/**
 * Props for TrimModal component
 */
export type TrimModalProps = {
  visible: boolean;
  recording: RecordingItem | null;
  onClose: () => void;
  onTrimmed: (trimmed: RecordingItem) => void;
};

/**
 * Props for RecorderControls component
 */
export type RecorderControlsProps = {
  state: RecorderState;
  file: string | null;
  elapsed: number;
  playElapsed: number;
  pulseAnim: Animated.Value;
  handleMicPress: () => void;
  handleStop: () => void;
  handlePlayPause: (filePath?: string, id?: string) => void;
  handleRestart: () => void;
  setHistoryVisible: (visible: boolean) => void;
  formatMMSS: (sec: number) => string;
};