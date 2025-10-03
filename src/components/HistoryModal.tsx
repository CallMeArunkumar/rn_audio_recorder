import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import RecordingRow from './RecordingRow';
import { HistoryModalProps } from '../types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../config/colors';

export default function HistoryModal({
  visible,
  recordings,
  state,
  currentPlayingId,
  onClose,
  handlePlayPause,
  trimRecording,
  saveRecording,
  deleteRecording,
}: HistoryModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Recordings</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {recordings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text>No recordings yet.</Text>
          </View>
        ) : (
          <FlatList
            data={recordings}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <RecordingRow
                item={item}
                state={state}
                currentPlayingId={currentPlayingId}
                handlePlayPause={handlePlayPause}
                trimRecording={trimRecording}
                saveRecording={saveRecording}
                deleteRecording={deleteRecording}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: Colors.white },
  modalHeader: {
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: Colors.borderColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  closeBtn: { padding: 8 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  closeText:{ fontSize: 18 },
  listContent:{ padding: 16 }
});
