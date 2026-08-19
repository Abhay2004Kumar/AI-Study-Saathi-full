import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { documentService } from '../../api/documents';
import AppButton from '../../components/AppButton';
import AppTextInput from '../../components/AppTextInput';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function UploadScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];
        setFile(pickedFile);
        if (!title) {
          setTitle(pickedFile.name.split('.').slice(0, -1).join('.'));
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick a document');
    }
  };

  const handleUpload = async () => {
    if (!file) { Alert.alert('No File', 'Please select a document first'); return; }
    if (!title) { Alert.alert('No Title', 'Please enter a title for the document'); return; }

    try {
      setUploading(true);
      await documentService.uploadDocument(file, title);
      Alert.alert('🎉 Uploaded!', 'Your document has been uploaded and is now processing.', [
        { text: 'Go to Dashboard', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Upload Failed', error.response?.data?.message || error.message);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconCircle}>
            <Text style={styles.heroIcon}>📤</Text>
          </View>
          <Text style={styles.title}>Upload Study Material</Text>
          <Text style={styles.subtitle}>Add a PDF or text file to start AI tutoring, quizzes, and flashcards</Text>
        </View>

        <View style={styles.form}>
          <AppTextInput
            label="Document Title"
            placeholder="e.g. DBMS Normalization Notes"
            value={title}
            onChangeText={setTitle}
            editable={!uploading}
            icon="📝"
          />

          {/* File picker */}
          <Text style={styles.fileLabel}>Select File</Text>
          {file ? (
            <View style={styles.fileCard}>
              <Text style={styles.fileEmoji}>
                {file.mimeType === 'application/pdf' ? '📕' : '📄'}
              </Text>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={2}>{file.name}</Text>
                <Text style={styles.fileSize}>{formatSize(file.size)}</Text>
              </View>
              {!uploading && (
                <TouchableOpacity onPress={handlePickDocument} style={styles.changeBtn}>
                  <Text style={styles.changeBtnText}>Change</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.pickZone} onPress={handlePickDocument} activeOpacity={0.8}>
              <Text style={styles.pickZoneEmoji}>📂</Text>
              <Text style={styles.pickZoneTitle}>Tap to browse files</Text>
              <Text style={styles.pickZoneSubtitle}>Supports PDF and TXT files</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <AppButton
            title={uploading ? 'Uploading...' : 'Upload & Process →'}
            onPress={handleUpload}
            loading={uploading}
            disabled={!file || !title}
            variant="success"
          />
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            disabled={uploading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  heroIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary + '40',
  },
  heroIcon: { fontSize: 42 },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  form: {
    flex: 1,
  },
  fileLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 8,
    marginLeft: 2,
  },

  pickZone: {
    backgroundColor: colors.surfaceWarm,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
  },
  pickZoneEmoji: { fontSize: 40, marginBottom: 12 },
  pickZoneTitle: { ...typography.subtitle, fontSize: 16, color: colors.text, marginBottom: 4 },
  pickZoneSubtitle: { ...typography.small, color: colors.textMuted },

  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.success + '60',
    gap: 12,
  },
  fileEmoji: { fontSize: 36 },
  fileInfo: { flex: 1 },
  fileName: { ...typography.body, fontWeight: '600', color: colors.text, marginBottom: 2 },
  fileSize: { ...typography.small, color: colors.textMuted },
  changeBtn: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changeBtnText: { ...typography.small, fontWeight: '700', color: colors.text },

  footer: {
    marginTop: 20,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
