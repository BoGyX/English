import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [moodleLoading, setMoodleLoading] = useState(false)
  const [useMoodle, setUseMoodle] = useState(false)
  const login = useAuthStore((state) => state.login)
  const loginMoodle = useAuthStore((state) => state.loginMoodle)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  const handleMoodleLogin = async () => {
    if (!email || !password) {
      setError('Введите username/email и пароль для входа через Moodle')
      return
    }
    setError('')
    setMoodleLoading(true)

    try {
      await loginMoodle(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка входа через Moodle')
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
              Вход в систему
            </h2>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="space-y-4">
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
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-text-light bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light sm:text-sm transition"
                  placeholder="••••••••"
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
                {loading ? 'Вход...' : 'Войти (обычный)'}
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
                    handleMoodleLogin()
                  } else {
                    setUseMoodle(true)
                    setEmail('')
                    setError('')
                  }
                }}
                disabled={loading || moodleLoading}
                className="w-full flex justify-center py-3 px-4 border-2 border-link-light text-sm font-medium rounded-lg text-link-light hover:bg-link-light hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-link-light disabled:opacity-50 transition-colors"
              >
                {moodleLoading ? 'Вход через Moodle...' : useMoodle ? 'Войти через Moodle' : 'Переключиться на Moodle'}
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
                  Вернуться к обычному входу
                </button>
              )}
            </div>

            <div className="text-center">
              <Link to="/register" className="text-link-light hover:text-link-dark font-medium transition-colors">
                Нет аккаунта? Зарегистрироваться
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
