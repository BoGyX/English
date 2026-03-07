import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [moodleLoading, setMoodleLoading] = useState(false)
  const [useMoodle, setUseMoodle] = useState(false)
  const register = useAuthStore((state) => state.register)
  const registerMoodle = useAuthStore((state) => state.registerMoodle)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(email, password, name || undefined)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const handleMoodleRegister = async () => {
    if (!email || !password) {
      setError('Введите username/email и пароль для регистрации через Moodle')
      return
    }
    setError('')
    setMoodleLoading(true)

    try {
      await registerMoodle(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка регистрации через Moodle')
    } finally {
      setMoodleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg-gradient to-bg-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-card-light rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-logo-bright mb-2">English Learning</h1>
            <h2 className="text-2xl font-semibold text-text-light">
              Регистрация
            </h2>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="space-y-4">
              {!useMoodle && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-light mb-1">
                    Имя (необязательно)
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-text-light bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light sm:text-sm transition"
                    placeholder="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-light mb-1">
                  {useMoodle ? 'Username (логин Moodle)' : 'Email'}
                </label>
                <input
                  id="email"
                  name="email"
                  type={useMoodle ? 'text' : 'email'}
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-text-light bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light sm:text-sm transition"
                  placeholder={useMoodle ? 'testadmin' : 'your@email.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-light mb-1">
                  Пароль
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-text-light bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light sm:text-sm transition"
                  placeholder="Минимум 6 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading || moodleLoading || useMoodle}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-logo-bright hover:bg-logo-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-logo-bright disabled:opacity-50 transition-colors"
              >
                {loading ? 'Регистрация...' : 'Зарегистрироваться (обычная)'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card-light text-text-light">или</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (useMoodle) {
                    handleMoodleRegister()
                  } else {
                    setUseMoodle(true)
                    setEmail('')
                    setName('')
                    setError('')
                  }
                }}
                disabled={loading || moodleLoading}
                className="w-full flex justify-center py-3 px-4 border-2 border-link-light text-sm font-medium rounded-lg text-link-light hover:bg-link-light hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-link-light disabled:opacity-50 transition-colors"
              >
                {moodleLoading ? 'Регистрация через Moodle...' : useMoodle ? 'Зарегистрироваться через Moodle' : 'Переключиться на Moodle'}
              </button>
              
              {useMoodle && (
                <button
                  type="button"
                  onClick={() => {
                    setUseMoodle(false)
                    setEmail('')
                    setError('')
                  }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Вернуться к обычной регистрации
                </button>
              )}
            </div>

            <div className="text-center">
              <Link to="/login" className="text-link-light hover:text-link-dark font-medium transition-colors">
                Уже есть аккаунт? Войти
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
