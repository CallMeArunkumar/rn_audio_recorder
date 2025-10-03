import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { formatMMSS } from '../utils';
import { Colors } from '../config/colors';
import { RecordingRowProps } from '../types';

/**
 * A single recording row component
 * @param RecordingRowProps
 */
export default function RecordingRow({
  item,
  state,
  currentPlayingId,
  handlePlayPause,
  trimRecording,
  saveRecording,
  deleteRecording,
}: RecordingRowProps) {
  const isPlaying =
    currentPlayingId === item.id &&
    (state === 'playing' || state === 'playPaused');

  return (
    <View style={styles.recordRow}>
      <View style={styles.container}>
        <Text style={styles.recordTitle}>{item.name ?? 'Recording'}</Text>
        <Text style={styles.recordMeta}>
          {formatMMSS(item.duration)} •{' '}
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>

      <View style={styles.rowBtns}>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => handlePlayPause(item.filePath, item.id)}
        >
          <Text style={styles.smallButtonText}>
            {isPlaying && state === 'playing' ? 'Pause' : 'Play'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => trimRecording(item.id)}
        >
          <Text style={styles.smallButtonText}>Trim</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => saveRecording(item.id)}
        >
          <Text style={styles.smallButtonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: Colors.danger }]}
          onPress={() => deleteRecording(item.id)}
        >
          <Text style={styles.smallButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  recordRow: {
    backgroundColor: Colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: { flex: 1 },
  recordTitle: { fontSize: 16, fontWeight: '600' },
  recordMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  rowBtns: { marginLeft: 12, flexDirection: 'row', alignItems: 'center' },
  smallButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  smallButtonText: { color: Colors.white, fontSize: 12 },
});
