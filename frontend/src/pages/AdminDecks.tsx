import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { adminService, Deck, CreateDeckRequest, Card, CreateCardRequest } from '../services/adminService'
import { dictionaryService } from '../services/dictionaryService'
import { useAuthStore } from '../store/authStore'
import FileUpload from '../components/FileUpload'

export default function AdminDecks() {
  const { courseId } = useParams<{ courseId: string }>()
  const { user, isAuthenticated } = useAuthStore()
  const [decks, setDecks] = useState<Deck[]>([])
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [course, setCourse] = useState<{ id: number; title: string } | null>(null)
  const [showDeckForm, setShowDeckForm] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [deckForm, setDeckForm] = useState<CreateDeckRequest>({
    course_id: parseInt(courseId || '0'),
    title: '',
    description: '',
  })
  const [cardForm, setCardForm] = useState<CreateCardRequest>({
    deck_id: 0,
    word: '',
    translation: '',
    phonetic: '',
    example: '',
    audio_url: '',
    image_url: '',
  })
  const [searchingWord, setSearchingWord] = useState(false)
  const [wordAudioURL, setWordAudioURL] = useState<string | null>(null)
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [autoDictionaryLookup, setAutoDictionaryLookup] = useState(true)
  const [dictionaryOverwrite, setDictionaryOverwrite] = useState(false)
  const [dictionaryFillTranslation, setDictionaryFillTranslation] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin' && courseId) {
      loadCourse()
      loadDecks()
    }
  }, [isAuthenticated, user, courseId])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  const loadCourse = async () => {
    try {
      const courseData = await adminService.getCourse(parseInt(courseId || '0'))
      setCourse({ id: courseData.id, title: courseData.title })
    } catch (error: any) {
      console.error('Error loading course:', error)
    }
  }

  const loadDecks = async () => {
    if (!courseId) {
      console.error('courseId is missing')
      setLoading(false)
      return
    }
    
    try {
      setLoading(true)
      const courseIdNum = parseInt(courseId)
      console.log('Loading decks for course:', courseIdNum)
      const data = await adminService.getDecksByCourse(courseIdNum)
      console.log('Loaded decks:', data)
      setDecks(data || [])
    } catch (error: any) {
      console.error('Error loading decks:', error)
      console.error('Error response:', error.response)
      setDecks([])
    } finally {
      setLoading(false)
    }
  }

  const loadCards = async (deckId: number) => {
    try {
      console.log('Loading cards for deck:', deckId)
      const data = await adminService.getCardsByDeck(deckId)
      console.log('Loaded cards:', data)
      setCards(data || [])
    } catch (error: any) {
      console.error('Error loading cards:', error)
      console.error('Error response:', error.response)
      setCards([])
    }
  }

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingDeck) {
        await adminService.updateDeck(editingDeck.id, {
          title: deckForm.title,
          description: deckForm.description || undefined,
        })
        console.log('Deck обновлен успешно!')
      } else {
        await adminService.createDeck(deckForm)
        console.log('Deck создан успешно!')
      }
      setDeckForm({ course_id: parseInt(courseId || '0'), title: '', description: '' })
      setShowDeckForm(false)
      setEditingDeck(null)
      await loadDecks()
    } catch (error: any) {
      console.error(`Error ${editingDeck ? 'updating' : 'creating'} deck:`, error)
    }
  }

  const handleEditDeck = (deck: Deck) => {
    setEditingDeck(deck)
    setDeckForm({
      course_id: deck.course_id,
      title: deck.title,
      description: deck.description || '',
    })
    setShowDeckForm(true)
  }

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDeck) {
      console.error('Deck not selected')
      return
    }
    
    try {
      const normalizedAudio =
        (wordAudioURL || cardForm.audio_url || '').trim() === ''
          ? undefined
          : (wordAudioURL || cardForm.audio_url || undefined)

      if (editingCard) {
        await adminService.updateCard(editingCard.id, {
          word: cardForm.word,
          translation: cardForm.translation,
          phonetic: cardForm.phonetic || undefined,
          example: cardForm.example || undefined,
          audio_url: normalizedAudio,
          image_url: cardForm.image_url || undefined,
        })
        console.log('Карточка обновлена успешно!')
      } else {
        const cardData = {
          deck_id: selectedDeck.id,
          word: cardForm.word,
          translation: cardForm.translation,
          phonetic: cardForm.phonetic || undefined,
          example: cardForm.example || undefined,
          audio_url: normalizedAudio,
          image_url: cardForm.image_url || undefined,
        }
        console.log('Creating card with data:', cardData)
        await adminService.createCard(cardData)
        console.log('Карточка создана успешно!')
      }
      setCardForm({ deck_id: 0, word: '', translation: '', phonetic: '', example: '', audio_url: '', image_url: '' })
      setWordAudioURL(null)
      setShowCardForm(false)
      setEditingCard(null)
      await loadCards(selectedDeck.id)
    } catch (error: any) {
      console.error('Error creating/updating card:', error)
    }
  }

  const handleEditCard = (card: Card) => {
    setEditingCard(card)
    setCardForm({
      deck_id: card.deck_id,
      word: card.word,
      translation: card.translation,
      phonetic: card.phonetic || '',
      example: card.example || '',
      audio_url: card.audio_url || '',
      image_url: card.image_url || '',
    })
    setWordAudioURL(card.audio_url || null)
    setShowCardForm(true)
  }

  const handleSearchWord = async (wordToSearch?: string) => {
    const word = (wordToSearch || cardForm.word).trim().toLowerCase()
    if (!word || word.length < 2) {
      return
    }

    try {
      setSearchingWord(true)
      const wordInfo = await dictionaryService.getWordInfo(word)
      
      // Заполняем из словаря (по умолчанию — НЕ трогаем перевод/картинку)
      setCardForm(prev => {
        const next = { ...prev }
        next.word = wordInfo.word

        const shouldOverwrite = dictionaryOverwrite

        if (shouldOverwrite || !next.phonetic) next.phonetic = wordInfo.phonetic || next.phonetic || ''
        if (shouldOverwrite || !next.example) next.example = wordInfo.example || next.example || ''
        if (shouldOverwrite || !next.audio_url) next.audio_url = wordInfo.audio_url || next.audio_url || ''

        // Перевод — только по флажку (и тоже с учетом overwrite)
        if (dictionaryFillTranslation) {
          if (shouldOverwrite || !next.translation) next.translation = wordInfo.definition || next.translation || ''
        }

        return next
      })
      
      // Сохраняем URL аудио
      if (wordInfo.audio_url) {
        setWordAudioURL(wordInfo.audio_url)
        setCardForm(prev => ({ ...prev, audio_url: wordInfo.audio_url || '' }))
      }
    } catch (error: any) {
      console.error('Error searching word:', error)
      // Не показываем ошибку, если пользователь просто вводит текст
    } finally {
      setSearchingWord(false)
    }
  }

  const handleWordChange = (value: string) => {
    setCardForm({ ...cardForm, word: value })
    
    // Очищаем предыдущий таймаут
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Автоматический поиск через 800ms после остановки ввода
    if (autoDictionaryLookup && value.trim().length >= 2) {
      const timeout = setTimeout(() => {
        handleSearchWord(value)
      }, 800)
      setSearchTimeout(timeout)
    }
  }

  const normalizeAudioUrl = (url: string) => {
    const trimmed = (url || '').trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('//')) return `https:${trimmed}`
    return trimmed
  }

  const playAudio = () => {
    if (wordAudioURL) {
      const audio = new Audio(normalizeAudioUrl(wordAudioURL))
      audio.play().catch(err => {
        console.error('Error playing audio:', err)
      })
    }
  }

  const handleDeleteDeck = async (id: number) => {
    if (!confirm('Удалить deck? Это действие нельзя отменить.')) return
    try {
      await adminService.deleteDeck(id)
      if (selectedDeck?.id === id) {
        setSelectedDeck(null)
        setCards([])
      }
      await loadDecks()
    } catch (error: any) {
      console.error('Error deleting deck:', error)
    }
  }

  const handleDeleteCard = async (id: number) => {
    if (!confirm('Удалить карточку?')) return
    try {
      await adminService.deleteCard(id)
      if (selectedDeck) {
        await loadCards(selectedDeck.id)
      }
    } catch (error: any) {
      console.error('Error deleting card:', error)
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="text-center py-8 text-text-light">Проверка доступа...</div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        У вас нет доступа к этой странице. Требуется роль администратора.
      </div>
    )
  }

  if (!courseId) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        Не указан ID курса
      </div>
    )
  }

  return (
    <div className="w-full">
      {loading && decks.length === 0 ? (
        <div className="text-center py-8 text-text-light">Загрузка...</div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <Link to="/admin/courses" className="text-link-light hover:text-link-dark mb-2 inline-block transition-colors">
                ← Назад к курсам
              </Link>
              <h1 className="text-3xl font-bold text-text-light">
                Управление деками
                {course && (
                  <span className="text-lg font-normal text-gray-500 ml-2">
                    - {course.title}
                  </span>
                )}
              </h1>
            </div>
        <button
          onClick={() => {
            if (showDeckForm) {
              setShowDeckForm(false)
              setEditingDeck(null)
              setDeckForm({ course_id: parseInt(courseId || '0'), title: '', description: '' })
            } else {
              setShowDeckForm(true)
              setEditingDeck(null)
            }
          }}
          className="bg-logo-bright hover:bg-logo-dark text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showDeckForm ? 'Отмена' : '+ Создать deck'}
        </button>
      </div>

      {showDeckForm && (
        <div className="bg-card-light shadow-md rounded-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-text-light">
            {editingDeck ? 'Редактировать deck' : 'Создать новый deck'}
          </h2>
          <form onSubmit={handleCreateDeck} className="space-y-4">
            <input
              type="text"
              placeholder="Название deck *"
              required
              value={deckForm.title}
              onChange={(e) => setDeckForm({ ...deckForm, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light transition"
            />
            <textarea
              placeholder="Описание"
              value={deckForm.description}
              onChange={(e) => setDeckForm({ ...deckForm, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light transition"
              rows={2}
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-accent-light hover:bg-accent-dark text-white px-4 py-2 rounded-lg transition-colors"
              >
                {editingDeck ? 'Сохранить' : 'Создать'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeckForm(false)
                  setEditingDeck(null)
                  setDeckForm({ course_id: parseInt(courseId || '0'), title: '', description: '' })
                }}
                className="bg-gray-300 hover:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card-light shadow-md rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-text-light">Деки</h2>
          {decks.length === 0 ? (
            <p className="text-text-light">Деков пока нет</p>
          ) : (
            <div className="space-y-2">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedDeck?.id === deck.id
                      ? 'border-link-light bg-link-light bg-opacity-10 shadow-md'
                      : 'border-gray-200 hover:border-link-light hover:shadow-sm'
                  }`}
                  onClick={async () => {
                    console.log('Deck clicked:', deck)
                    setSelectedDeck(deck)
                    setShowCardForm(false)
                    setEditingCard(null)
                    setCardForm({ deck_id: 0, word: '', translation: '', phonetic: '', example: '', audio_url: '', image_url: '' })
                    setWordAudioURL(null)
                    await loadCards(deck.id)
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold text-text-light mb-1">{deck.title}</div>
                      {deck.description && (
                        <div className="text-sm text-gray-500 mb-2">{deck.description}</div>
                      )}
                      <div className="text-xs text-gray-400">Позиция: {deck.position}</div>
                    </div>
                    <div className="flex space-x-2 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditDeck(deck)
                        }}
                        className="text-blue-600 hover:text-blue-800 transition-colors text-sm px-2 py-1 rounded hover:bg-blue-50"
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteDeck(deck.id)
                        }}
                        className="text-logo-bright hover:text-logo-dark transition-colors text-sm px-2 py-1 rounded hover:bg-red-50"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card-light shadow-md rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-text-light">
                Карточки {selectedDeck && `(${selectedDeck.title})`}
              </h2>
              {selectedDeck && (
                <p className="text-sm text-gray-500 mt-1">
                  Deck ID: {selectedDeck.id} | Карточек: {cards.length}
                </p>
              )}
            </div>
            {selectedDeck && (
              <button
                  onClick={() => {
                    if (showCardForm) {
                      setShowCardForm(false)
                      setEditingCard(null)
                    setCardForm({ deck_id: 0, word: '', translation: '', phonetic: '', example: '', audio_url: '', image_url: '' })
                    setWordAudioURL(null)
                    } else {
                      setShowCardForm(true)
                      setEditingCard(null)
                      setWordAudioURL(null)
                    }
                  }}
                className="bg-logo-bright hover:bg-logo-dark text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                {showCardForm ? 'Отмена' : '+ Добавить карточку'}
              </button>
            )}
          </div>

          {!selectedDeck ? (
            <div className="text-center py-8">
              <p className="text-text-light mb-2">Выберите deck для просмотра карточек</p>
              <p className="text-xs text-gray-400">Кликните на deck слева, чтобы увидеть его карточки</p>

            </div>
          ) : showCardForm ? (
            <form onSubmit={handleCreateCard} className="space-y-3">
              <h3 className="text-lg font-semibold text-text-light mb-2">
                {editingCard ? 'Редактировать карточку' : 'Создать новую карточку'}
              </h3>
              
              {/* Поле слова с автоматическим поиском */}
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Слово на английском * (автопоиск)"
                    required
                    value={cardForm.word}
                    onChange={(e) => handleWordChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light transition"
                  />
                  {searchingWord && (
                    <div className="absolute right-2 top-2 text-blue-600 animate-spin">⏳</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleSearchWord()}
                  disabled={searchingWord || !cardForm.word.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  title="Найти слово в словаре"
                >
                  🔍
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoDictionaryLookup}
                    onChange={(e) => setAutoDictionaryLookup(e.target.checked)}
                  />
                  <span>Автопоиск словаря</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={dictionaryOverwrite}
                    onChange={(e) => setDictionaryOverwrite(e.target.checked)}
                  />
                  <span>Перезаписывать поля</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={dictionaryFillTranslation}
                    onChange={(e) => setDictionaryFillTranslation(e.target.checked)}
                  />
                  <span>Заполнять “перевод” из словаря</span>
                </label>
              </div>
              {cardForm.word && (
                <p className="text-xs text-gray-500">
                  {searchingWord
                    ? 'Поиск в словаре...'
                    : autoDictionaryLookup
                      ? 'Автопоиск включен (заполнит фонетику/пример/аудио). Перевод и фото — руками.'
                      : 'Автопоиск выключен — заполняйте все поля вручную или нажмите 🔍'}
                </p>
              )}
              <input
                type="text"
                placeholder="Перевод *"
                required
                value={cardForm.translation}
                onChange={(e) => setCardForm({ ...cardForm, translation: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light transition"
              />
              <FileUpload
                type="audio"
                currentUrl={cardForm.audio_url || ''}
                onUrlChange={(url) => {
                  setCardForm({ ...cardForm, audio_url: url })
                  setWordAudioURL(url ? url : null)
                }}
                label="URL аудио (опционально)"
                placeholder="https://...mp3 (или загрузите файл)"
              />
              {/* Фонетика с кнопкой прослушивания */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Фонетика"
                  value={cardForm.phonetic}
                  onChange={(e) => setCardForm({ ...cardForm, phonetic: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light transition"
                />
                {wordAudioURL && (
                  <button
                    type="button"
                    onClick={playAudio}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    title="Прослушать произношение"
                  >
                    🔊
                  </button>
                )}
              </div>
              <textarea
                placeholder="Пример"
                value={cardForm.example}
                onChange={(e) => setCardForm({ ...cardForm, example: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light transition"
                rows={2}
              />
              {/* Поле для URL изображения */}
              <FileUpload
                type="image"
                currentUrl={cardForm.image_url || ''}
                onUrlChange={(url) => setCardForm({ ...cardForm, image_url: url })}
                label="URL изображения (или оставьте пустым для автогенерации)"
                placeholder="https://example.com/image.jpg"
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-accent-light hover:bg-accent-dark text-white px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  {editingCard ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCardForm(false)
                    setEditingCard(null)
                    setCardForm({ deck_id: 0, word: '', translation: '', phonetic: '', example: '', audio_url: '', image_url: '' })
                    setWordAudioURL(null)
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <>
              {cards.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-text-light mb-4">Карточек пока нет в этом deck</p>
                  <p className="text-xs text-gray-400 mb-4">
                    Выбран deck: <strong>{selectedDeck.title}</strong> (ID: {selectedDeck.id})
                  </p>
                  <button
                    onClick={() => setShowCardForm(true)}
                    className="bg-logo-bright hover:bg-logo-dark text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    + Добавить первую карточку
                  </button>
                </div>
              ) : (
            <div className="space-y-3">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-link-light hover:shadow-sm transition-all bg-white"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="font-bold text-lg text-text-light">{card.word}</div>
                        {card.phonetic && (
                          <div className="text-sm text-gray-400">[{card.phonetic}]</div>
                        )}
                        {card.audio_url && (
                          <button
                            onClick={() => {
                              const audio = new Audio(normalizeAudioUrl(card.audio_url!))
                              audio.play().catch(err => {
                                console.error('Error playing audio:', err)
                              })
                            }}
                            className="text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded hover:bg-green-50 transition-colors"
                            title="Прослушать произношение"
                          >
                            🔊
                          </button>
                        )}
                      </div>
                      <div className="text-base text-gray-700 font-medium mb-2">{card.translation}</div>
                      {card.example && (
                        <div className="text-sm text-gray-500 italic border-l-2 border-link-light pl-2 mt-2">
                          "{card.example}"
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-3">
                      <button
                        onClick={() => handleEditCard(card)}
                        className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-logo-bright hover:text-logo-dark text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
              )}
            </>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  )
}
