import { useState, useRef } from 'react'
import { uploadService } from '../services/uploadService'
import { config } from '../config'

interface FileUploadProps {
  type: 'image' | 'audio'
  currentUrl?: string
  onUrlChange: (url: string) => void
  label: string
  placeholder: string
}

export default function FileUpload({ type, currentUrl, onUrlChange, label, placeholder }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверка типа файла
    if (type === 'image') {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        console.error('Недопустимый формат изображения. Разрешены: JPG, PNG, GIF, WEBP')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        console.error('Файл слишком большой. Максимальный размер: 5MB')
        return
      }
    } else if (type === 'audio') {
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
      if (!validTypes.includes(file.type) && !file.name.endsWith('.mp3') && !file.name.endsWith('.m4a')) {
        console.error('Недопустимый формат аудио. Разрешены: MP3, WAV, OGG, M4A')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        console.error('Файл слишком большой. Максимальный размер: 10MB')
        return
      }
    }

    try {
      setUploading(true)
      let result
      if (type === 'image') {
        result = await uploadService.uploadImage(file)
      } else {
        result = await uploadService.uploadAudio(file)
      }
      
      // Формируем полный URL используя config
      const fullUrl = config.getFullUrl(result.url)
      onUrlChange(fullUrl)
      console.log('Файл успешно загружен!')
    } catch (error: any) {
      console.error('Error uploading file:', error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-text-light mb-2">{label}</label>
      
      {/* Переключатель режима */}
      <div className="flex space-x-2 mb-2">
        <button
          type="button"
          onClick={() => setUploadMode('url')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            uploadMode === 'url'
              ? 'bg-link-light text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🔗 URL
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('file')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            uploadMode === 'file'
              ? 'bg-link-light text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📁 Загрузить файл
        </button>
      </div>

      {uploadMode === 'url' ? (
        /* Режим ввода URL */
        <input
          type="url"
          placeholder={placeholder}
          value={currentUrl || ''}
          onChange={(e) => onUrlChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light transition"
        />
      ) : (
        /* Режим загрузки файла */
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={type === 'image' ? 'image/jpeg,image/jpg,image/png,image/gif,image/webp' : 'audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/m4a'}
            onChange={handleFileSelect}
            disabled={uploading}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-link-light file:text-white hover:file:bg-link-dark disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {uploading && (
            <p className="text-sm text-blue-600 mt-2">Загрузка файла...</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {type === 'image' 
              ? 'Форматы: JPG, PNG, GIF, WEBP. Макс. размер: 5MB'
              : 'Форматы: MP3, WAV, OGG, M4A. Макс. размер: 10MB'
            }
          </p>
        </div>
      )}

      {/* Превью для изображений */}
      {type === 'image' && currentUrl && (
        <div className="mt-2">
          <img
            src={currentUrl}
            alt="Preview"
            className="w-full max-w-xs h-32 object-cover rounded-lg border border-gray-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Кнопка прослушивания для аудио */}
      {type === 'audio' && currentUrl && (
        <button
          type="button"
          onClick={() => {
            const audio = new Audio(currentUrl)
            audio.play().catch(err => {
              console.error('Error playing audio:', err)
            })
          }}
          className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          🔊 Прослушать
        </button>
      )}
    </div>
  )
}
