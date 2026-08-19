import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, Alert, TouchableOpacity
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { documentService } from '../../api/documents';
import AppCard from '../../components/AppCard';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res: any = await documentService.getDocuments();
      setDocuments(res.data || []);
    } catch (error) {
      console.log('Error fetching documents', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await documentService.deleteDocument(id);
              fetchDocuments();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete document');
            }
          }
        }
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchDocuments();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  // Stats
  const readyCount = documents.filter(d => d.processingStatus === 'READY').length;
  const totalCount = documents.length;

  const renderHeader = () => (
    <View>
      {/* Greeting Header */}
      <View style={styles.greetingRow}>
        <View style={styles.greetingText}>
          <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0] || 'Student'}, 👋</Text>
          <Text style={styles.greetingSubtitle}>Ready to study today?</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{(user?.name?.[0] || 'S').toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Banner */}
      {totalCount > 0 && (
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>📄</Text>
            <View>
              <Text style={styles.statValue}>{totalCount}</Text>
              <Text style={styles.statLabel}>Documents</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>✅</Text>
            <View>
              <Text style={styles.statValue}>{readyCount}</Text>
              <Text style={styles.statLabel}>Ready to Study</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🔥</Text>
            <View>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>
        </View>
      )}

      {/* Section header */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>My Documents</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(app)/upload' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Upload</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your documents...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIllustration}>
          <Text style={styles.emptyEmoji}>📭</Text>
        </View>
        <Text style={styles.emptyTitle}>No documents yet</Text>
        <Text style={styles.emptyText}>Upload your first study material to get started with AI tutoring, quizzes, and flashcards.</Text>
        <TouchableOpacity
          style={styles.uploadCta}
          onPress={() => router.push('/(app)/upload' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.uploadCtaText}>Upload First Document →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppCard
            title={item.title}
            subtitle={item.fileName}
            status={item.processingStatus}
            date={item.createdAt}
            actions={item.processingStatus === 'READY' ? [
              {
                label: '🤖 Tutor',
                onPress: () => router.push({
                  pathname: '/(app)/tutoring/[id]',
                  params: { id: item.id, title: item.title }
                } as any)
              },
              {
                label: '📝 Quiz',
                variant: 'secondary',
                onPress: () => router.push({
                  pathname: '/(app)/quiz/[id]',
                  params: { id: item.id, title: item.title }
                } as any)
              },
              {
                label: '🃏 Cards',
                variant: 'secondary',
                onPress: () => router.push({
                  pathname: '/(app)/flashcards/[id]',
                  params: { id: item.id, title: item.title }
                } as any)
              },
              {
                label: '🗑',
                variant: 'danger',
                onPress: () => handleDelete(item.id, item.title)
              }
            ] : [
              {
                label: '🗑 Delete',
                variant: 'danger',
                onPress: () => handleDelete(item.id, item.title)
              }
            ]}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },

  // Greeting
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
  },
  greetingText: {
    flex: 1,
  },
  greeting: {
    ...typography.header,
    fontSize: 26,
    color: colors.text,
  },
  greetingSubtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 2,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarText: {
    ...typography.subtitle,
    color: '#FFFFFF',
    fontSize: 18,
  },

  // Stats Banner
  statsBanner: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statEmoji: {
    fontSize: 26,
  },
  statValue: {
    ...typography.title,
    fontSize: 20,
    color: '#FFFFFF',
  },
  statLabel: {
    ...typography.small,
    color: 'rgba(255,255,255,0.8)',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  // Section Row
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.success,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyIllustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surfaceWarm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: colors.border,
  },
  emptyEmoji: {
    fontSize: 46,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: 10,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  uploadCta: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  uploadCtaText: {
    ...typography.body,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 16,
  },
});
