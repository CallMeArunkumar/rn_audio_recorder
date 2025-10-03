import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { RecordingItem, TrimModalProps } from '../types';
import AudioRecorder from '../config/AudioRecorder';
import { Colors } from '../config/colors';


export default function TrimModal({ visible, recording, onClose, onTrimmed }: TrimModalProps) {
  const [trimStart, setTrimStart] = useState('0');
  const [trimEnd, setTrimEnd] = useState('0');

  useEffect(() => {
    if (recording) {
      setTrimStart('0');
      setTrimEnd(`${recording.duration}`);
    }
  }, [recording]);

  const handleTrim = async () => {
    if (!recording) return;

    const startSec = Number(trimStart);
    const endSec = Number(trimEnd);

    if (startSec >= endSec) {
      Alert.alert('Invalid', 'Start must be less than End.');
      return;
    }

    try {
      const trimmedPath = await AudioRecorder.trim(recording.filePath, startSec, endSec);

      const trimmedRec: RecordingItem = {
        id: `${Date.now()}`,
        filePath: trimmedPath,
        duration: endSec - startSec,
        createdAt: Date.now(),
        name: `${recording.name} (Trimmed)`,
      };

      onTrimmed(trimmedRec);
      onClose();
      Alert.alert('Trimmed', 'Recording trimmed successfully.');
    } catch (e) {
      console.warn('Trim error', e);
      Alert.alert('Error', 'Failed to trim recording.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Trim Recording</Text>

          <Text>Start (seconds)</Text>
          <TextInput
            value={trimStart}
            keyboardType="numeric"
            onChangeText={text => {
              let val = text.replace(/[^0-9]/g, '');
              if (recording) val = Math.min(Number(val), recording.duration).toString();
              setTrimStart(val);
            }}
            style={styles.input}
          />

          <Text>End (seconds)</Text>
          <TextInput
            value={trimEnd}
            keyboardType="numeric"
            onChangeText={text => {
              let val = text.replace(/[^0-9]/g, '');
              if (recording) val = Math.min(Number(val), recording.duration).toString();
              setTrimEnd(val);
            }}
            style={styles.input}
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.closeLay} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleTrim}>
              <Text style={styles.trimText}>Trim</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderGray,
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelText: { color: Colors.cancelText },
  trimText: { color: Colors.primary, fontWeight: 'bold' },
  closeLay:{ marginRight: 12 }
});
