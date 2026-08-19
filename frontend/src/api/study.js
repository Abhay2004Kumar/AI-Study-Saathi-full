import apiClient from './client';

export const studyService = {
  /**
   * Generate a quiz for a document
   * @param {string} documentId
   * @param {string} topic
   * @param {string} difficulty - 'easy', 'medium', 'hard'
   * @param {number} numberOfQuestions
   * @returns {Promise<Object>}
   */
  async generateQuiz(subject, topic, difficulty = 'medium', numberOfQuestions = 5) {
    const response = await apiClient.post('/ai/quiz/generate', {
      subject,
      topic,
      difficulty,
      numberOfQuestions
    });
    return response.data;
  },

  /**
   * Generate flashcards for a document
   * @param {string} subject
   * @param {string} topic
   * @param {number} numberOfCards
   * @returns {Promise<Object>}
   */
  async generateFlashcards(subject, topic, numberOfCards = 10) {
    const response = await apiClient.post('/flashcards/generate', {
      subject,
      topic,
      numberOfCards
    });
    return response.data;
  }
};
