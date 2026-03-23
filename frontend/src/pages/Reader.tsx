import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

interface ReadingText {
  id: number
  user_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export default function Reader() {
  const navigate = useNavigate()
  const [texts, setTexts] = useState<ReadingText[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [uploading, setUploading] = useState(false)

  const getUserId = () => {
    const authStorage = localStorage.getItem('auth-storage')
    if (!authStorage) return null
    const parsed = JSON.parse(authStorage)
    return parsed?.state?.user?.id
  }

  useEffect(() => {
    loadTexts()
  }, [])

  const loadTexts = async () => {
    try {
      setLoading(true)
      const userId = getUserId()
      if (!userId) return

      const response = await api.get<ReadingText[]>(`/reading-texts?user_id=${userId}`)
      setTexts(response.data || [])
    } catch (error) {
      console.error('Error loading texts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setContent(text)
      setTitle(file.name.replace(/\.(txt|docx?)$/i, ''))
    }
    reader.readAsText(file)
  }

  const handleSaveText = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Заполните название и текст')
      return
    }

    const userId = getUserId()
    if (!userId) {
      alert('Пользователь не авторизован')
      return
    }

    try {
      setUploading(true)
      await api.post('/reading-texts', {
        user_id: userId,
        title: title.trim(),
        content: content.trim()
      })

      setTitle('')
      setContent('')
      setShowUploadForm(false)
      await loadTexts()
    } catch (error) {
      console.error('Error saving text:', error)
      alert('Ошибка при сохранении текста')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteText = async (textId: number) => {
    if (!confirm('Удалить этот текст?')) return

    const userId = getUserId()
    if (!userId) return

    try {
      await api.delete(`/reading-texts/${textId}?user_id=${userId}`)
      await loadTexts()
    } catch (error) {
      console.error('Error deleting text:', error)
      alert('Ошибка при удалении текста')
    }
  }

  const openText = (textId: number) => {
    navigate(`/reader/${textId}`)
  }

  if (loading) {
    return <div className="text-center py-8 text-text-light">Загрузка...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-text-light">📖 Ридер</h1>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
        >
          {showUploadForm ? '✕ Отмена' : '+ Добавить текст'}
        </button>
      </div>

      {/* Форма загрузки текста */}
      {showUploadForm && (
        <div className="bg-white p-6 rounded-lg border-2 border-blue-300 mb-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Добавить новый текст</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Загрузить из файла (.txt)
            </label>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название текста
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="например: My favorite book"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Текст на английском
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Вставьте или введите текст на английском..."
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <button
            onClick={handleSaveText}
            disabled={uploading}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400"
          >
            {uploading ? 'Сохранение...' : '✓ Сохранить текст'}
          </button>
        </div>
      )}

      {/* Список текстов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {texts.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-gray-500 text-lg">У вас пока нет текстов</p>
            <p className="text-gray-400 text-sm mt-2">Добавьте первый текст для чтения</p>
          </div>
        ) : (
          texts.map((text) => (
            <div
              key={text.id}
              className="bg-white rounded-lg shadow-md border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              onClick={() => openText(text.id)}
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{text.title}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {new Date(text.created_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {text.content.substring(0, 150)}...
                </p>
              </div>
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <span className="text-blue-600 text-sm font-semibold">Читать →</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteText(text.id)
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors"
                  title="Удалить текст"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
