import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { studyService } from '../../../api/study';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export default function FlashcardsScreen() {
  const { id, title } = useLocalSearchParams();
  const router = useRouter();

  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const subject = typeof title === 'string' ? title : 'Study Document';
        const res: any = await studyService.generateFlashcards(subject, 'Comprehensive Review', 5);
        if (res.data && res.data.flashcards && res.data.flashcards.length > 0) {
          setCards(res.data.flashcards);
        } else if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setCards(res.data);
        } else {
          Alert.alert('Info', 'No flashcards were generated.');
        }
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to generate flashcards.');
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [id, title]);

  const flipCard = () => {
    const toValue = flipped ? 0 : 180;
    Animated.spring(flipAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start(() => setFlipped(!flipped));
  };

  const goNext = () => {
    if (currentIndex < cards.length - 1) {
      setFlipped(false);
      flipAnim.setValue(0);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      flipAnim.setValue(0);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotate  = flipAnim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingEmoji}>🃏</Text>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 16 }} />
          <Text style={styles.loadingTitle}>Generating Flashcards...</Text>
          <Text style={styles.loadingSubtitle}>Creating smart study cards from your notes</Text>
        </View>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>No flashcards generated</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Text style={styles.headerBackText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Flashcards</Text>
        <Text style={styles.headerCount}>{currentIndex + 1}/{cards.length}</Text>
      </View>

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {cards.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentIndex && styles.dotActive, i < currentIndex && styles.dotDone]}
          />
        ))}
      </View>

      {/* Card area */}
      <View style={styles.cardArea}>
        <TouchableOpacity style={styles.cardWrapper} onPress={flipCard} activeOpacity={1}>
          {/* Front */}
          <Animated.View style={[styles.card, styles.cardFront, { transform: [{ rotateY: frontRotate }] }]}>
            <Text style={styles.cardSideLabel}>TAP TO FLIP</Text>
            <Text style={styles.cardEmoji}>❓</Text>
            <Text style={styles.cardContent}>{currentCard.front}</Text>
            {currentCard.hint && (
              <View style={styles.hintBox}>
                <Text style={styles.hintText}>💡 {currentCard.hint}</Text>
              </View>
            )}
          </Animated.View>

          {/* Back */}
          <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backRotate }] }]}>
            <Text style={styles.cardSideLabelBack}>ANSWER</Text>
            <Text style={styles.cardEmoji}>✅</Text>
            <Text style={styles.cardContentBack}>{currentCard.back}</Text>
            {currentCard.source && (
              <Text style={styles.sourceText}>📄 {currentCard.source}</Text>
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, currentIndex === 0 && styles.controlBtnDisabled]}
          onPress={goPrev}
          disabled={currentIndex === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.controlBtnText}>← Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.flipBtnSmall} onPress={flipCard} activeOpacity={0.8}>
          <Text style={styles.flipBtnText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, styles.controlBtnNext, currentIndex === cards.length - 1 && styles.controlBtnDisabled]}
          onPress={goNext}
          disabled={currentIndex === cards.length - 1}
          activeOpacity={0.8}
        >
          <Text style={[styles.controlBtnText, styles.controlBtnNextText]}>Next →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  loadingEmoji: { fontSize: 56, marginBottom: 4 },
  loadingTitle: { ...typography.subtitle, color: colors.text },
  loadingSubtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  errorEmoji: { fontSize: 56, marginBottom: 12 },
  errorText: { ...typography.subtitle, color: colors.text, marginBottom: 24 },
  backBtn: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backBtnText: { ...typography.body, fontWeight: '700', color: colors.text },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerBack: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceWarm,
    justifyContent: 'center', alignItems: 'center',
  },
  headerBackText: { fontSize: 24, color: colors.text, lineHeight: 28 },
  headerTitle: { ...typography.subtitle, color: colors.text },
  headerCount: { ...typography.body, color: colors.textMuted, fontWeight: '600' },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  dotDone: {
    backgroundColor: colors.success,
  },

  cardArea: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  cardWrapper: {
    height: 380,
    width: '100%',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 28,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardFront: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cardBack: {
    backgroundColor: colors.success,
  },
  cardSideLabel: {
    position: 'absolute',
    top: 20,
    ...typography.label,
    color: colors.textLight,
    fontSize: 10,
  },
  cardSideLabelBack: {
    position: 'absolute',
    top: 20,
    ...typography.label,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  cardEmoji: { fontSize: 42, marginBottom: 16 },
  cardContent: {
    ...typography.title,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 32,
  },
  cardContentBack: {
    ...typography.title,
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
  },
  hintBox: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: colors.surfaceWarm,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 20,
  },
  hintText: { ...typography.small, color: colors.textMuted, textAlign: 'center' },
  sourceText: {
    position: 'absolute',
    bottom: 20,
    ...typography.small,
    color: 'rgba(255,255,255,0.7)',
  },

  controls: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    alignItems: 'center',
  },
  controlBtn: {
    flex: 1,
    backgroundColor: colors.surfaceWarm,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlBtnNext: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  controlBtnDisabled: {
    opacity: 0.35,
  },
  controlBtnText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  controlBtnNextText: {
    color: '#FFFFFF',
  },
  flipBtnSmall: {
    backgroundColor: colors.background,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  flipBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
});
