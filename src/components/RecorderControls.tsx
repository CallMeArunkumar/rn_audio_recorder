import React from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../config/colors';
import { RecorderControlsProps, RecorderState } from '../types';

/**
 * @param Props for RecorderControls component
 * @returns
 */
export default function RecorderControls({
  state,
  file,
  elapsed,
  playElapsed,
  pulseAnim,
  handleMicPress,
  handleStop,
  handlePlayPause,
  handleRestart,
  setHistoryVisible,
  formatMMSS,
}: RecorderControlsProps) {
  const micLabel = (s: RecorderState) =>
    s === 'idle' ? 'Start' : s === 'recording' ? 'Pause' : 'Resume';

  const playLabel = (s: RecorderState) => (s === 'playing' ? 'Pause' : 'Play');

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.micContainer, { transform: [{ scale: pulseAnim }] }]}
      >
        <TouchableOpacity
          disabled={state !== 'idle'}
          style={[
            styles.micButton,
            (state === 'playing' || state === 'recording') ? styles.micButtonPlay : undefined
          ]}
          onPress={handleMicPress}
        >
          <Text style={styles.micText}>
            {state === 'playing' || state === 'playPaused' ? '🔊' : '🎙️'}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.elapsed}>
        {state === 'playing' || state === 'playPaused'
          ? formatMMSS(playElapsed)
          : formatMMSS(elapsed)}
      </Text>

      {(state === 'recording' || state === 'paused') && (
        <TouchableOpacity style={styles.pauseButton} onPress={handleMicPress}>
          <Text style={styles.stopText}>{micLabel(state)}</Text>
        </TouchableOpacity>
      )}

      {(state === 'recording' ||
        state === 'paused' ||
        state === 'playing' ||
        state === 'playPaused') && (
        <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
          <Text style={styles.stopText}>Stop</Text>
        </TouchableOpacity>
      )}

      {state === 'stopped' && file && (
        <>
          <TouchableOpacity style={styles.playButton}  onPress={() => handlePlayPause(file.filePath, undefined)}>
            <Text style={styles.playText}>{playLabel(state)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={handleRestart}
          >
            <Text style={styles.restartText}>Restart</Text>
          </TouchableOpacity>
        </>
      )}

      {/* History button */}
      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => setHistoryVisible(true)}
      >
        <Text style={styles.historyText}>History</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 60 },
  micContainer: { marginBottom: 24 },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.micBackground,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.danger,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
  },
  micButtonPlay:{
    backgroundColor: Colors.success,
  },
  micText: { fontSize: 40, color: Colors.white },
  elapsed: { fontSize: 28, color: Colors.black, marginBottom: 20 },
  pauseButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: Colors.danger,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  stopText: { color: Colors.white, fontSize: 16 },
  playButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  playText: { color: Colors.white, fontSize: 16 },
  restartButton: {
    backgroundColor: Colors.success,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  restartText: { color: Colors.white, fontSize: 14 },
  historyBtn: { position: 'absolute', bottom: 60 },
  historyText: {
    color: Colors.primary,
    fontSize: 18,
    textDecorationLine: 'underline',
  },
});
