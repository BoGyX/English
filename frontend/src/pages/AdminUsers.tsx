import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'

interface User {
  id: string
  email: string
  name?: string
  role: string
  created_at: string
}

const USERS_PER_PAGE = 10

export default function AdminUsers() {
  const { user } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (user?.role !== 'admin') return
    loadUsers()
  }, [user])

  // Сброс на первую страницу при изменении поиска
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get<User[]>('/users')
      setUsers(response.data)
    } catch (error: any) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async (_userId: string, newRole: string) => {
    if (!confirm(`Изменить роль пользователя на "${newRole}"?`)) return
    try {
      // Пока нет endpoint для изменения роли, можно добавить позже
      console.log('Функция изменения роли будет добавлена позже')
      // await api.put(`/admin/users/${userId}/role`, { role: newRole })
      // await loadUsers()
    } catch (error: any) {
      console.error('Error changing role:', error)
    }
  }

  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    
    const email = u.email.toLowerCase()
    const name = (u.name || '').toLowerCase()
    
    return email.includes(query) || name.includes(query)
  })

  // Пагинация
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE)
  const startIndex = (currentPage - 1) * USERS_PER_PAGE
  const endIndex = startIndex + USERS_PER_PAGE
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // Кнопка "Первая"
    if (startPage > 1) {
      pages.push(
        <button
          key="first"
          onClick={() => goToPage(1)}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          1
        </button>
      )
      if (startPage > 2) {
        pages.push(
          <span key="dots-start" className="px-2 text-gray-400">
            ...
          </span>
        )
      }
    }

    // Страницы
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-2 border rounded-lg transition-colors ${
            currentPage === i
              ? 'bg-link-light text-white border-link-light'
              : 'border-gray-300 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      )
    }

    // Кнопка "Последняя"
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="dots-end" className="px-2 text-gray-400">
            ...
          </span>
        )
      }
      pages.push(
        <button
          key="last"
          onClick={() => goToPage(totalPages)}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {totalPages}
        </button>
      )
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ← Назад
        </button>
        {pages}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Вперед →
        </button>
      </div>
    )
  }

  if (user?.role !== 'admin') {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        У вас нет доступа к этой странице
      </div>
    )
  }

  if (loading) {
    return <div className="text-center py-8 text-text-light">Загрузка пользователей...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-light">Управление пользователями</h1>
        <div className="text-sm text-gray-500">
          {searchQuery ? (
            <>Найдено: {filteredUsers.length} из {users.length}</>
          ) : (
            <>Всего: {users.length}</>
          )}
        </div>
      </div>

      {/* Поиск */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск по имени или email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light transition"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Очистить поиск"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            Поиск: "{searchQuery}" - найдено {filteredUsers.length} {filteredUsers.length === 1 ? 'пользователь' : 'пользователей'}
          </p>
        )}
      </div>

      <div className="bg-card-light shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase">Имя</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase">Роль</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase">Дата регистрации</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-text-light">
                  {searchQuery ? (
                    <div>
                      <p className="mb-2">Пользователи не найдены</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-link-light hover:text-link-dark underline text-sm"
                      >
                        Сбросить поиск
                      </button>
                    </div>
                  ) : (
                    'Пользователей пока нет'
                  )}
                </td>
              </tr>
            ) : (
              currentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-text-light">{u.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-text-light">{u.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {u.role === 'admin' ? 'Администратор' : 'Пользователь'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-text-light">
                      {new Date(u.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleChangeRole(u.id, 'admin')}
                        className="text-accent-light hover:text-accent-dark transition-colors"
                      >
                        Сделать админом
                      </button>
                    )}
                    {u.role === 'admin' && u.id !== user?.id && (
                      <button
                        onClick={() => handleChangeRole(u.id, 'user')}
                        className="text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Убрать админа
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {renderPagination()}

      {filteredUsers.length > 0 && (
        <div className="mt-4 text-sm text-text-light text-center">
          Показано {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} из {filteredUsers.length} | Страница <strong>{currentPage}</strong> из <strong>{totalPages}</strong>
        </div>
      )}
    </div>
  )
}
