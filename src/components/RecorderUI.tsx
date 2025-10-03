import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, AppState, Easing, StyleSheet } from 'react-native';
import RNFS from 'react-native-fs';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sound from 'react-native-sound';
import AudioRecorder from '../config/AudioRecorder';
import { Colors } from '../config/colors';
import { RECORDINGS_KEY } from '../constants';
import { RecorderState, RecordingItem } from '../types';
import {
  checkMicrophonePermission,
  formatMMSS,
  sanitizeFileName,
} from '../utils';
import HistoryModal from './HistoryModal';
import RecorderControls from './RecorderControls';
import TrimModal from './TrimModal';

/**
 * Recorder UI Component
 */
export default function RecorderUI() {
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [file, setFile] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [playElapsed, setPlayElapsed] = useState(0);

  const [trimModalVisible, setTrimModalVisible] = useState(false);
  const [trimTarget, setTrimTarget] = useState<RecordingItem | null>(null);

  const [historyVisible, setHistoryVisible] = useState(false);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);

  const playerRef = useRef<Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const startTimeRef = useRef<number | null>(null);

  const accumulatedTimeRef = useRef<number>(0);
  const appStateRef = useRef(AppState.currentState);

  /**
   * Pulse animation for mic button
   */
  const startPulse = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  /**
   * Stop pulse animation
   */
  const stopPulse = useCallback(() => {
    pulseAnim.stopAnimation(() => {
      pulseAnim.setValue(1);
    });
  }, [pulseAnim]);

  /**
   * Load recordings from AsyncStorage on mount
   */
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(RECORDINGS_KEY);
        if (raw) setRecordings(JSON.parse(raw));
      } catch (e) {
        console.warn('Failed to load recordings', e);
      }
    })();
  }, []);

  /**
   * Persist recordings to AsyncStorage whenever it changes
   */
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
      } catch (e) {
        console.warn('Failed to save recordings', e);
      }
    })();
  }, [recordings]);
  /**
   * Recording Timer (updates elapsed while recording)
   */
  useEffect(() => {
    let rafId = 0;

    const tick = () => {
      if (state === 'recording' && startTimeRef.current != null) {
        const now = Date.now();
        const msElapsed =
          accumulatedTimeRef.current + (now - startTimeRef.current);
        setElapsed(Math.floor(msElapsed / 1000));
        rafId = requestAnimationFrame(tick);
      }
    };

    /**
     * start tick loop (tick checks state itself)
     */
    tick();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [state]);

  /**
   * AppState listener to track foreground/background (if needed)
   * Currently just updates a ref; no action taken on state change
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      appStateRef.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  /**
   * AudioRecorder event listeners
   * Handles recording state changes and updates UI accordingly
   */
  useEffect(() => {
    const subs = [
      AudioRecorder.addListener('onRecordingStarted', () => {
        // reset accumulators on start of a new recording
        accumulatedTimeRef.current = 0;
        startTimeRef.current = Date.now();
        setElapsed(0);
        setFile(null);
        setRecordedDuration(0);
        setState('recording');
        startPulse();
      }),
      /**
       * Pause recording: update accumulators
       */
      AudioRecorder.addListener('onRecordingPaused', () => {
        if (startTimeRef.current) {
          accumulatedTimeRef.current += Date.now() - startTimeRef.current;
          startTimeRef.current = null;
        }
        setState('paused');
        stopPulse();
        setElapsed(Math.floor(accumulatedTimeRef.current / 1000));
      }),
      /**
       * Resume recording: update start time
       */
      AudioRecorder.addListener('onRecordingResumed', () => {
        startTimeRef.current = Date.now();
        setState('recording');
        startPulse();
      }),
      /**
       * Recording stopped: finalize duration, save file info, update UI
       */
      AudioRecorder.addListener('onRecordingStopped', e => {
        // On stop, compute final duration robustly:
        let finalMs = accumulatedTimeRef.current;
        if (startTimeRef.current) {
          finalMs += Date.now() - startTimeRef.current;
        }
        const finalSeconds = Math.max(0, Math.floor(finalMs / 1000));
        // reset accumulators
        accumulatedTimeRef.current = 0;
        startTimeRef.current = null;
        setElapsed(finalSeconds);
        setRecordedDuration(finalSeconds);
        setFile(e.filePath ?? null);
        setState('stopped');
        stopPulse();

        // Save to recordings list (persisted)
        if (e.filePath) {
          const newRec: RecordingItem = {
            id: `${Date.now()}`, // simple id using timestamp
            filePath: e.filePath,
            duration: finalSeconds,
            createdAt: Date.now(),
            name: `Recording ${new Date().toLocaleString()}`,
          };
          setRecordings(prev => [newRec, ...prev]);
        }
      }),
    ];
    return () => subs.forEach(s => s.remove());
  }, [startPulse, stopPulse]);

  /**
   * Handle mic button press (start/pause/resume recording based on state)
   */
  const handleMicPress = async () => {
    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) return;

    if (state === 'idle') {
      AudioRecorder.start();
    } else if (state === 'recording') {
      AudioRecorder.pause();
    } else if (state === 'paused') {
      AudioRecorder.resume();
    }
  };

  /**
   * Stop audio player if active
   * @param onStopped Optional callback when stop completes
   */
  const stopPlayer = (onStopped?: () => void) => {
    if (playerRef.current) {
      playerRef.current.stop(() => {
        playerRef.current?.release();
        playerRef.current = null;
        setState('stopped');
        stopPulse();
        setPlayElapsed(0);
        setCurrentPlayingId(null);
        if (onStopped) onStopped();
      });
    } else {
      if (onStopped) onStopped();
    }
  };

  /**
   * Handle Stop button press (stop recording or playback based on state)
   */
  const handleStop = () => {
    if (state === 'recording' || state === 'paused') {
      AudioRecorder.stop();
    } else if (state === 'playing' || state === 'playPaused') {
      stopPlayer();
    }
  };

  /**
   * Play or pause audio playback
   * @param filePath Optional file path to play (if not provided, plays last recorded file)
   * @param id Optional recording id (for tracking current playing in list)
   * @returns
   */
  const handlePlayPause = async (filePath?: string, id?: string) => {
    // if filePath provided, play that. Otherwise play last recorded file
    const targetFile = filePath ?? file;
    if (!targetFile) return;

    // if currently playing a different file, stop it first
    if (playerRef.current && currentPlayingId && currentPlayingId !== id) {
      stopPlayer();
    }
    if (!playerRef.current) {
      const sound = new Sound(targetFile, '', err => {
        if (err) {
          console.warn('Failed to load sound', err);
          return;
        }
        // set state and UI
        setState('playing');
        startPulse();
        setCurrentPlayingId(id ?? 'single-file');
        // determine duration to initialize remaining timer
        const dur = sound.getDuration
          ? Math.floor(sound.getDuration())
          : recordedDuration;
        setPlayElapsed(dur);

        const updateTimer = () => {
          if (playerRef.current && state === 'playing') {
            playerRef.current.getCurrentTime(seconds => {
              setPlayElapsed(Math.max(Math.floor(dur - seconds), 0));
              requestAnimationFrame(updateTimer);
            });
          }
        };
        updateTimer();

        sound.play(() => {
          sound.release();
          playerRef.current = null;
          setState('stopped');
          stopPulse();
          setPlayElapsed(0);
          setCurrentPlayingId(null);
        });

        playerRef.current = sound;
      });
    } else {
      // toggle pause / resume
      if (state === 'playing') {
        playerRef.current.pause();
        setState('playPaused');
        stopPulse();
      } else if (state === 'playPaused') {
        playerRef.current.play(() => {
          playerRef.current?.release();
          playerRef.current = null;
          setState('stopped');
          stopPulse();
          setPlayElapsed(0);
          setCurrentPlayingId(null);
        });
        setState('playing');
        startPulse();
      }
    }
  };

  /**
   * Restart recording session (reset UI and accumulators; does not delete recordings)
   */
  const handleRestart = () => {
    // reset UI and accumulators (does not delete saved recordings)
    setState('idle');
    setElapsed(0);
    setFile(null);
    setPlayElapsed(0);
    setRecordedDuration(0);
    stopPulse();
    startTimeRef.current = null;
    accumulatedTimeRef.current = 0;
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current.release();
      playerRef.current = null;
    }
  };
  /**
   * Delete a recording item (both from list and file if RNFS available)
   * @param id  ID of recording to delete
   * @returns
   */
  const deleteRecording = async (id: string) => {
    const rec = recordings.find(r => r.id === id);
    if (!rec) return;

    Alert.alert('Delete', 'Delete this recording?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (await RNFS.exists(rec.filePath)) {
              await RNFS.unlink(rec.filePath);
            }
          } catch (e) {
            console.warn('Failed to delete file', e);
          }
          setRecordings(prev => prev.filter(r => r.id !== id));
        },
      },
    ]);
  };

  /**
   * Trim a recording (opens trim modal; actual trimming requires native implementation)
   * @param id ID of recording to trim
   * @returns
   */
  const trimRecording = async (id: string) => {
    const rec = recordings.find(r => r.id === id);
    if (!rec) return;

    setTrimTarget(rec);
    setTrimModalVisible(true);
  };

  /**
   * Save/share a recording (copies to external directory and opens share dialog)
   * @param id ID of recording to save/share
   * @returns
   */
  const saveRecording = async (id: string) => {
    const rec = recordings.find(r => r.id === id);
    if (!rec || !rec.filePath) {
      Alert.alert('Error', 'Recording file not found!');
      return;
    }
    try {
      const exists = await RNFS.exists(rec.filePath);
      if (!exists) {
        Alert.alert('Error', 'Recording file does not exist.');
        return;
      }
      const safeName = sanitizeFileName(rec.name || `Recording_${Date.now()}`);
      const destPath = `${RNFS.ExternalDirectoryPath}/${safeName}.aac`;
      if (!(await RNFS.exists(destPath))) {
        await RNFS.copyFile(rec.filePath, destPath);
      }
      await AudioRecorder.shareFile(destPath, 'audio/aac');
    } catch (e: any) {
      console.warn('Failed to save/share recording', e);
      Alert.alert(
        'Error',
        `Could not save or share the recording.\n${e.message || e}`,
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Main recorder controls */}
      <RecorderControls
        state={state}
        file={file}
        elapsed={elapsed}
        playElapsed={playElapsed}
        pulseAnim={pulseAnim}
        handleMicPress={handleMicPress}
        handleStop={handleStop}
        handlePlayPause={handlePlayPause}
        handleRestart={handleRestart}
        setHistoryVisible={setHistoryVisible}
        formatMMSS={formatMMSS}
      />

      {/* Trim modal */}
      <TrimModal
        visible={trimModalVisible}
        recording={trimTarget}
        onClose={() => setTrimModalVisible(false)}
        onTrimmed={trimmedRec => setRecordings(prev => [trimmedRec, ...prev])}
      />

      {/* Full screen history modal */}
      <HistoryModal
        visible={historyVisible}
        recordings={recordings}
        state={state}
        currentPlayingId={currentPlayingId}
        onClose={() => setHistoryVisible(false)}
        handlePlayPause={handlePlayPause}
        trimRecording={trimRecording}
        saveRecording={saveRecording}
        deleteRecording={deleteRecording}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
});
