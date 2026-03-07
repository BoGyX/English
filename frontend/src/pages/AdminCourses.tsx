import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminService, Course, CreateCourseRequest } from '../services/adminService'
import { useAuthStore } from '../store/authStore'
import { uploadService } from '../services/uploadService'
import { config } from '../config'

export default function AdminCourses() {
  const { user, isAuthenticated } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState<CreateCourseRequest>({
    title: '',
    description: '',
    image_url: '',
  })
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadCourses()
    }
  }, [isAuthenticated, user])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await adminService.getAllCourses()
      console.log('Loaded courses:', data) // Debug log
      setCourses(data || [])
    } catch (error: any) {
      console.error('Error loading courses:', error)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setUploading(true)
      let imageUrl = formData.image_url

      // Если выбран файл, сначала загружаем его
      if (imageMode === 'file' && selectedFile) {
        const uploadResult = await uploadService.uploadImage(selectedFile)
        imageUrl = uploadResult.url
      }

      if (editingCourse) {
        await adminService.updateCourse(editingCourse.id, {
          title: formData.title,
          description: formData.description || undefined,
          image_url: imageUrl || undefined,
        })
        console.log('Курс обновлен успешно!')
      } else {
        await adminService.createCourse({
          title: formData.title,
          description: formData.description || undefined,
          image_url: imageUrl || undefined,
          is_published: false, // По умолчанию курс не опубликован
        })
        console.log('Курс создан успешно!')
      }
      await loadCourses()
      setFormData({ title: '', description: '', image_url: '' })
      setSelectedFile(null)
      setShowForm(false)
      setEditingCourse(null)
    } catch (error: any) {
      console.error(`Error ${editingCourse ? 'updating' : 'creating'} course:`, error)
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      description: course.description || '',
      image_url: course.image_url || '',
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingCourse(null)
    setFormData({ title: '', description: '', image_url: '' })
    setSelectedFile(null)
    setImageMode('url')
  }

  const handlePublish = async (id: number) => {
    try {
      await adminService.publishCourse(id)
      await loadCourses()
    } catch (error: any) {
      console.error('Error publishing course:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить курс? Это действие нельзя отменить.')) return
    try {
      await adminService.deleteCourse(id)
      await loadCourses()
    } catch (error: any) {
      console.error('Error deleting course:', error)
    }
  }

  // Показываем загрузку пока проверяем авторизацию
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

  return (
    <div className="w-full">
      {loading ? (
        <div className="text-center py-8 text-text-light">Загрузка курсов...</div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-light">Управление курсами</h1>
        <button
          onClick={() => {
            if (showForm) {
              handleCancel()
            } else {
              setShowForm(true)
              setEditingCourse(null)
            }
          }}
          className="bg-logo-bright hover:bg-logo-dark text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Отмена' : '+ Создать курс'}
        </button>
      </div>

      {showForm && (
        <div className="bg-card-light shadow-md rounded-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-text-light">
            {editingCourse ? 'Редактировать курс' : 'Создать новый курс'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Название курса *"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light transition"
            />
            <textarea
              placeholder="Описание"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light transition"
              rows={3}
            />
            
            {/* Выбор способа добавления изображения */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-light">
                Изображение курса
              </label>
              <div className="flex gap-4 mb-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="imageMode"
                    value="url"
                    checked={imageMode === 'url'}
                    onChange={() => {
                      setImageMode('url')
                      setSelectedFile(null)
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-text-light">URL изображения</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="imageMode"
                    value="file"
                    checked={imageMode === 'file'}
                    onChange={() => {
                      setImageMode('file')
                      setFormData({ ...formData, image_url: '' })
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-text-light">Загрузить файл</span>
                </label>
              </div>

              {imageMode === 'url' ? (
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light transition"
                />
              ) : (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setSelectedFile(file)
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-link-light focus:border-link-light transition file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-link-light file:text-white hover:file:bg-link-dark file:cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600">
                      Выбран файл: {selectedFile.name}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={uploading}
                className="bg-accent-light hover:bg-accent-dark text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Загрузка...' : editingCourse ? 'Сохранить' : 'Создать'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card-light shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase">Название</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-text-light">
                  Курсов пока нет. Создайте первый курс!
                </td>
              </tr>
            ) : (
              courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {course.image_url && (
                        <img
                          src={config.getFullUrl(course.image_url)}
                          alt={course.title}
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-text-light">{course.title}</div>
                        {course.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">{course.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        course.is_published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {course.is_published ? 'Опубликован' : 'Черновик'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/admin/decks/${course.id}`}
                        className="text-link-light hover:text-link-dark transition-colors px-2 py-1 rounded hover:bg-link-light hover:bg-opacity-10"
                      >
                        Деки →
                      </Link>
                      <button
                        onClick={() => handleEdit(course)}
                        className="text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded hover:bg-blue-50"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handlePublish(course.id)}
                        className="text-accent-light hover:text-accent-dark transition-colors px-2 py-1 rounded hover:bg-accent-light hover:bg-opacity-10"
                      >
                        {course.is_published ? 'Снять' : 'Опубликовать'}
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="text-logo-bright hover:text-logo-dark transition-colors px-2 py-1 rounded hover:bg-logo-bright hover:bg-opacity-10"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  )
}
