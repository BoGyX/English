import api from './api'

export interface WordInfo {
  word: string
  phonetic: string
  audio_url?: string
  definition: string
  example?: string
  meanings?: string[]
}

export const dictionaryService = {
  async getWordInfo(word: string): Promise<WordInfo> {
    const response = await api.get<WordInfo>(`/dictionary/${encodeURIComponent(word)}`)
    return response.data
  },
}
