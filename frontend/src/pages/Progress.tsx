import { useState, useEffect } from 'react'
import api from '../services/api'

interface Course {
  id: number
  title: string
  description?: string
}

interface Deck {
  id: number
  course_id: number
  title: string
  description?: string
}

interface Card {
  id: number
  deck_id: number
  word: string
  translation: string
}

interface DeckProgress {
  deckId: number
  deckTitle: string
  totalCards: number
  withPhoto: number
  withoutPhoto: number
  russian: number
  constructor: number
  averageProgress: number
}

interface CourseProgress {
  courseId: number
  courseTitle: string
  totalDecks: number
  completedDecks: number
  averageProgress: number
  decks: DeckProgress[]
}

export default function Progress() {
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([])
  const [expandedCourses, setExpandedCourses] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [overallProgress, setOverallProgress] = useState(0)

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      setLoading(true)
      
      // Получаем user_id
      const authStorage = localStorage.getItem('auth-storage')
      if (!authStorage) {
        setLoading(false)
        return
      }
      
      const parsed = JSON.parse(authStorage)
      const userId = parsed?.state?.user?.id
      if (!userId) {
        setLoading(false)
        return
      }
      
      // Загружаем все курсы
      const coursesResponse = await api.get<Course[]>('/courses')
      const allCourses = coursesResponse.data || []

      // Загружаем прогресс пользователя по карточкам
      const userCardsResponse = await api.get(`/user-cards/user/${userId}`)
      const userCards = userCardsResponse.data || []

      // Для каждого курса загружаем деки и считаем прогресс
      const progressData: CourseProgress[] = []
      
      for (const course of allCourses) {
        const decksResponse = await api.get<Deck[]>(`/decks?course_id=${course.id}`)
        const decks = decksResponse.data || []
        
        const deckProgressData: DeckProgress[] = []
        
        for (const deck of decks) {
          const cardsResponse = await api.get<Card[]>(`/cards?deck_id=${deck.id}`)
          const cards = cardsResponse.data || []
          const totalCards = cards.length
          
          if (totalCards === 0) continue
          
          // Получаем прогресс из backend по режимам
          let withPhotoCount = 0
          let withoutPhotoCount = 0
          let russianCount = 0
          let constructorCount = 0
          
          cards.forEach(card => {
            const userCard = userCards.find((uc: any) => uc.card_id === card.id)
            if (userCard) {
              if (userCard.mode_with_photo) withPhotoCount++
              if (userCard.mode_without_photo) withoutPhotoCount++
              if (userCard.mode_russian) russianCount++
              if (userCard.mode_constructor) constructorCount++
            }
          })
          
          const withPhotoPercent = (withPhotoCount / totalCards) * 100
          const withoutPhotoPercent = (withoutPhotoCount / totalCards) * 100
          const russianPercent = (russianCount / totalCards) * 100
          const constructorPercent = (constructorCount / totalCards) * 100
          
          const averageProgress = (withPhotoPercent + withoutPhotoPercent + russianPercent + constructorPercent) / 4
          
          deckProgressData.push({
            deckId: deck.id,
            deckTitle: deck.title,
            totalCards,
            withPhoto: Math.round(withPhotoPercent),
            withoutPhoto: Math.round(withoutPhotoPercent),
            russian: Math.round(russianPercent),
            constructor: Math.round(constructorPercent),
            averageProgress: Math.round(averageProgress)
          })
        }
        
        // Считаем средний прогресс по курсу
        const courseAverage = deckProgressData.length > 0
          ? deckProgressData.reduce((sum, d) => sum + d.averageProgress, 0) / deckProgressData.length
          : 0
        
        const completedDecks = deckProgressData.filter(d => d.averageProgress === 100).length
        
        progressData.push({
          courseId: course.id,
          courseTitle: course.title,
          totalDecks: deckProgressData.length,
          completedDecks,
          averageProgress: Math.round(courseAverage),
          decks: deckProgressData
        })
      }
      
      setCourseProgress(progressData)
      
      // Считаем общий прогресс по всем курсам
      const overall = progressData.length > 0
        ? progressData.reduce((sum, c) => sum + c.averageProgress, 0) / progressData.length
        : 0
      setOverallProgress(Math.round(overall))
      
    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCourse = (courseId: number) => {
    const newExpanded = new Set(expandedCourses)
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId)
    } else {
      newExpanded.add(courseId)
    }
    setExpandedCourses(newExpanded)
  }

  const CircularProgress = ({ percent, size = 120 }: { percent: number; size?: number }) => {
    const radius = (size - 10) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percent / 100) * circumference
    
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#3b82f6"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-text-light">{percent}%</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-8 text-text-light">Загрузка прогресса...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-light mb-6">Мой прогресс</h1>

      {/* Общий прогресс */}
      <div className="bg-card-light shadow-md rounded-lg p-6 mb-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-light mb-2">Общий прогресс</h2>
            <p className="text-gray-500">Средний прогресс по всем курсам</p>
          </div>
          <CircularProgress percent={overallProgress} size={140} />
        </div>
      </div>

      {/* Прогресс по курсам */}
      <div className="space-y-4">
        {courseProgress.length === 0 ? (
          <div className="bg-card-light shadow-md rounded-lg p-6 border border-gray-200 text-center">
            <p className="text-text-light">Начните изучать курсы, чтобы увидеть прогресс</p>
          </div>
        ) : (
          courseProgress.map((course) => (
            <div key={course.courseId} className="bg-card-light shadow-md rounded-lg border border-gray-200 overflow-hidden">
              {/* Заголовок курса */}
              <button
                onClick={() => toggleCourse(course.courseId)}
                className="w-full p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <CircularProgress percent={course.averageProgress} size={100} />
                    <div className="text-left">
                      <h3 className="text-xl font-bold text-text-light mb-2">{course.courseTitle}</h3>
                      <p className="text-sm text-gray-500">
                        Уроков: {course.totalDecks} | Завершено: {course.completedDecks}
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl text-gray-400">
                    {expandedCourses.has(course.courseId) ? '▼' : '▶'}
                  </span>
                </div>
              </button>

              {/* Детали по декам */}
              {expandedCourses.has(course.courseId) && (
                <div className="border-t border-gray-200 bg-gray-50 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.decks.map((deck) => (
                      <div
                        key={deck.deckId}
                        className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-text-light mb-1">
                              {deck.deckTitle}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {deck.totalCards} карточек
                            </p>
                          </div>
                          <CircularProgress percent={deck.averageProgress} size={80} />
                        </div>

                        {/* Прогресс по режимам */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">С фото:</span>
                            <span className="font-semibold text-blue-600">{deck.withPhoto}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${deck.withPhoto}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Без фото:</span>
                            <span className="font-semibold text-green-600">{deck.withoutPhoto}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${deck.withoutPhoto}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">На русском:</span>
                            <span className="font-semibold text-purple-600">{deck.russian}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full transition-all"
                              style={{ width: `${deck.russian}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Конструктор:</span>
                            <span className="font-semibold text-orange-600">{deck.constructor}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full transition-all"
                              style={{ width: `${deck.constructor}%` }}
                            />
                          </div>
                        </div>

                        {deck.averageProgress === 100 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                            <span className="text-green-600 font-semibold">✓ Урок завершен</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
