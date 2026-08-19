import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { studyService } from '../../../api/study';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export default function QuizScreen() {
  const { id, title } = useLocalSearchParams();
  const router = useRouter();

  const [quizData, setQuizData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [answerScale] = useState(new Animated.Value(1));

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const subject = typeof title === 'string' ? title : 'Study Document';
        const res: any = await studyService.generateQuiz(subject, 'Comprehensive Review', 'medium', 5);
        if (res.data && res.data.questions) {
          setQuizData(res.data);
        } else {
          Alert.alert('Info', 'No quiz was generated.');
        }
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to generate quiz.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, title]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingEmoji}>🧠</Text>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 16 }} />
          <Text style={styles.loadingTitle}>Generating Your Quiz...</Text>
          <Text style={styles.loadingSubtitle}>Crafting questions from your study material</Text>
        </View>
      </View>
    );
  }

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>Could not generate quiz</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const questions = quizData.questions;
  const currentQuestion = questions[currentQuestionIndex];
  let options: string[] = [];
  try {
    options = typeof currentQuestion.options === 'string'
      ? JSON.parse(currentQuestion.options)
      : currentQuestion.options;
  } catch (e) { options = []; }

  const handleSelectOption = (option: string) => {
    if (selectedAnswers[currentQuestionIndex]) return;

    Animated.sequence([
      Animated.timing(answerScale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(answerScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }),
    ]).start();

    setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: option }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q: any, idx: number) => {
      if (selectedAnswers[idx] === q.correctAnswer) score++;
    });
    return score;
  };

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    const { emoji, message } = percentage >= 80
      ? { emoji: '🌟', message: 'Outstanding! You really know this!' }
      : percentage >= 50
        ? { emoji: '👍', message: 'Good effort! Keep studying!' }
        : { emoji: '📖', message: 'Review the material and try again!' };

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsEmoji}>{emoji}</Text>
          <Text style={styles.resultsTitle}>Quiz Complete!</Text>

          <View style={styles.scoreCard}>
            <View style={[styles.scoreCircle, { borderColor: percentage >= 50 ? colors.success : colors.error }]}>
              <Text style={[styles.scoreNumber, { color: percentage >= 50 ? colors.success : colors.error }]}>
                {score}/{questions.length}
              </Text>
              <Text style={styles.scorePercent}>{percentage}%</Text>
            </View>
          </View>

          <Text style={styles.resultsMessage}>{message}</Text>

          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>Back to Dashboard →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const selectedForCurrent = selectedAnswers[currentQuestionIndex];
  const progress = (currentQuestionIndex + 1) / questions.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Text style={styles.headerBackText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Quiz'}</Text>
        <Text style={styles.headerProgress}>
          <Text style={styles.headerProgressCurrent}>{currentQuestionIndex + 1}</Text>/{questions.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` as any }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Question {currentQuestionIndex + 1}</Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map((option: string, index: number) => {
            const isSelected = selectedForCurrent === option;
            const isCorrect = selectedForCurrent && option === currentQuestion.correctAnswer;
            const isWrong = isSelected && option !== currentQuestion.correctAnswer;

            let btnStyle = styles.optionDefault;
            let textStyle = styles.optionTextDefault;
            if (isCorrect) { btnStyle = styles.optionCorrect; textStyle = styles.optionTextSelected; }
            else if (isWrong) { btnStyle = styles.optionWrong; textStyle = styles.optionTextSelected; }

            return (
              <Animated.View key={index} style={{ transform: [{ scale: isSelected ? answerScale : new Animated.Value(1) }] }}>
                <TouchableOpacity
                  style={[styles.optionBtn, btnStyle]}
                  onPress={() => handleSelectOption(option)}
                  activeOpacity={selectedForCurrent ? 1 : 0.8}
                >
                  <Text style={[styles.optionText, textStyle]}>{option}</Text>
                  <Text style={styles.optionArrow}>
                    {isCorrect ? '✓' : isWrong ? '✗' : '›'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* See Explanation if answered */}
        {selectedForCurrent && currentQuestion.explanation && (
          <View style={styles.explanationCard}>
            <Text style={styles.explanationTitle}>💡 Explanation</Text>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      {selectedForCurrent && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>
              {currentQuestionIndex === questions.length - 1 ? 'See Results 🎉' : 'Next Question →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceWarm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackText: { fontSize: 24, color: colors.text, lineHeight: 28 },
  headerTitle: { ...typography.subtitle, color: colors.text, flex: 1, textAlign: 'center' },
  headerProgress: { ...typography.body, color: colors.textMuted, fontWeight: '600', minWidth: 36, textAlign: 'right' },
  headerProgressCurrent: { color: colors.success, fontWeight: '800' },

  // Progress bar
  progressBarBg: {
    height: 6,
    backgroundColor: colors.border,
    marginHorizontal: 20,
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Question
  questionCard: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionLabel: {
    ...typography.label,
    color: colors.primary,
    marginBottom: 10,
  },
  questionText: {
    ...typography.title,
    fontSize: 21,
    color: colors.text,
    lineHeight: 30,
  },

  // Options
  optionsContainer: { gap: 12 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  optionDefault: {
    backgroundColor: colors.primary,
  },
  optionCorrect: {
    backgroundColor: colors.success,
  },
  optionWrong: {
    backgroundColor: colors.error,
  },
  optionText: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  optionTextDefault: { color: '#FFFFFF' },
  optionTextSelected: { color: '#FFFFFF' },
  optionArrow: { color: 'rgba(255,255,255,0.8)', fontSize: 22, fontWeight: '700' },

  // Explanation
  explanationCard: {
    backgroundColor: colors.successLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  explanationTitle: { ...typography.caption, color: colors.success, fontWeight: '700', marginBottom: 6 },
  explanationText: { ...typography.body, color: colors.text, lineHeight: 22 },

  // Footer
  footer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  nextBtn: {
    backgroundColor: colors.success,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { ...typography.body, fontWeight: '800', color: '#FFFFFF', fontSize: 17 },

  // Results
  resultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: colors.background,
  },
  resultsEmoji: { fontSize: 72, marginBottom: 12 },
  resultsTitle: { ...typography.header, color: colors.text, marginBottom: 32 },
  scoreCard: { marginBottom: 24 },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  scoreNumber: { ...typography.header, fontSize: 38 },
  scorePercent: { ...typography.body, color: colors.textMuted },
  resultsMessage: { ...typography.subtitle, color: colors.text, textAlign: 'center', marginBottom: 40, lineHeight: 26 },
  doneBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  doneBtnText: { ...typography.body, fontWeight: '800', color: '#FFFFFF', fontSize: 17 },
});
