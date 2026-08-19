import apiClient from './client';

export const documentService = {
  /**
   * Upload a new document
   * @param {Object} file - The file object from expo-document-picker
   * @param {string} title - The title of the document
   * @returns {Promise<Object>}
   */
  async uploadDocument(file, title) {
    const formData = new FormData();
    
    // React Native requires a specific format for file uploads in FormData
    formData.append('title', title);
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    });

    const response = await apiClient.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  /**
   * Get all user documents
   * @returns {Promise<Object>}
   */
  async getDocuments() {
    const response = await apiClient.get('/documents');
    return response.data;
  },

  /**
   * Check processing status of a document
   * @param {string} id - Document ID
   * @returns {Promise<Object>}
   */
  async getDocumentStatus(id) {
    const response = await apiClient.get(`/documents/${id}/status`);
    return response.data;
  },

  /**
   * Delete a document
   * @param {string} id - Document ID
   * @returns {Promise<Object>}
   */
  async getDocument(id) {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },

  /**
   * Delete a document
   * @param {string} id
   * @returns {Promise<Object>}
   */
  async deleteDocument(id) {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  }
};
