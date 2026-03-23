import api from './api'

export interface WordInfo {
  word: string
  phonetic?: string
  translation: string
  example?: string
  audio_url?: string
  definitions?: Array<{
    partOfSpeech: string
    definition: string
    example?: string
  }>
}

export const dictionaryService = {
  async getWordInfo(word: string): Promise<WordInfo> {
    try {
      const response = await api.get<WordInfo>(`/dictionary/${encodeURIComponent(word)}`)
      return response.data
    } catch (error) {
      console.error('Error fetching word info:', error)
      throw error
    }
  }
}
