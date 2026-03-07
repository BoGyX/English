import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { config } from '../config'

export default function AdminDashboard() {
  const { user } = useAuthStore()

  if (user?.role !== 'admin') {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        У вас нет доступа к админ панели
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-light mb-6">Админ панель</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/admin/courses"
          className="bg-card-light shadow-md rounded-lg p-6 hover:shadow-lg transition-all border border-gray-200 hover:border-link-light"
        >
          <h2 className="text-xl font-semibold text-text-light mb-2">Управление курсами</h2>
          <p className="text-text-light">Создание, редактирование и публикация курсов</p>
        </Link>

        <Link
          to="/admin/users"
          className="bg-card-light shadow-md rounded-lg p-6 hover:shadow-lg transition-all border border-gray-200 hover:border-link-light"
        >
          <h2 className="text-xl font-semibold text-text-light mb-2">Пользователи</h2>
          <p className="text-text-light">Управление пользователями и ролями</p>
        </Link>

        <div className="bg-card-light shadow-md rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-text-light mb-2">Статистика</h2>
          <p className="text-text-light">Просмотр статистики платформы</p>
        </div>
      </div>

      <div className="bg-card-light shadow-md rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-text-light mb-4">Быстрые действия</h2>
        <div className="space-y-2">
          <Link
            to="/admin/courses"
            className="block text-link-light hover:text-link-dark transition-colors"
          >
            → Создать новый курс
          </Link>
          <a
            href={`${config.baseUrl}/swagger/index.html`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-link-light hover:text-link-dark transition-colors"
          >
            → Открыть Swagger документацию
          </a>
        </div>
      </div>
    </div>
  )
}
