package services

import (
	"context"
	"english-learning/internal/models"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CourseService struct {
	db *pgxpool.Pool
}

func NewCourseService(db *pgxpool.Pool) *CourseService {
	return &CourseService{db: db}
}

// GetAllCourses возвращает список всех курсов
func (s *CourseService) GetAllCourses() ([]models.Course, error) {
	rows, err := s.db.Query(context.Background(),
		"SELECT id, title, description, image_url, is_published, created_by, created_at FROM courses ORDER BY created_at DESC",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courses []models.Course
	for rows.Next() {
		var course models.Course
		err := rows.Scan(&course.ID, &course.Title, &course.Description, &course.ImageURL, &course.IsPublished, &course.CreatedBy, &course.CreatedAt)
		if err != nil {
			return nil, err
		}
		courses = append(courses, course)
	}

	return courses, nil
}

// GetPublishedCourses возвращает только опубликованные курсы
func (s *CourseService) GetPublishedCourses() ([]models.Course, error) {
	rows, err := s.db.Query(context.Background(),
		"SELECT id, title, description, image_url, is_published, created_by, created_at FROM courses WHERE is_published = true ORDER BY created_at DESC",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var courses []models.Course
	for rows.Next() {
		var course models.Course
		err := rows.Scan(&course.ID, &course.Title, &course.Description, &course.ImageURL, &course.IsPublished, &course.CreatedBy, &course.CreatedAt)
		if err != nil {
			return nil, err
		}
		courses = append(courses, course)
	}

	return courses, nil
}

// GetCourseByID возвращает курс по ID
func (s *CourseService) GetCourseByID(courseID int64) (*models.Course, error) {
	var course models.Course
	err := s.db.QueryRow(context.Background(),
		"SELECT id, title, description, image_url, is_published, created_by, created_at FROM courses WHERE id = $1",
		courseID,
	).Scan(&course.ID, &course.Title, &course.Description, &course.ImageURL, &course.IsPublished, &course.CreatedBy, &course.CreatedAt)

	if err != nil {
		return nil, errors.New("course not found")
	}

	return &course, nil
}

// CreateCourse создает новый курс
func (s *CourseService) CreateCourse(title string, description *string, imageURL *string, isPublished bool, createdBy *uuid.UUID) (*models.Course, error) {
	var course models.Course
	err := s.db.QueryRow(context.Background(),
		`INSERT INTO courses (title, description, image_url, is_published, created_by)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, title, description, image_url, is_published, created_by, created_at`,
		title, description, imageURL, isPublished, createdBy,
	).Scan(&course.ID, &course.Title, &course.Description, &course.ImageURL, &course.IsPublished, &course.CreatedBy, &course.CreatedAt)

	if err != nil {
		return nil, err
	}

	return &course, nil
}

// UpdateCourse обновляет курс
func (s *CourseService) UpdateCourse(courseID int64, title string, description *string, imageURL *string, isPublished bool) (*models.Course, error) {
	var course models.Course
	err := s.db.QueryRow(context.Background(),
		`UPDATE courses 
		 SET title = $1, description = $2, image_url = $3, is_published = $4
		 WHERE id = $5
		 RETURNING id, title, description, image_url, is_published, created_by, created_at`,
		title, description, imageURL, isPublished, courseID,
	).Scan(&course.ID, &course.Title, &course.Description, &course.ImageURL, &course.IsPublished, &course.CreatedBy, &course.CreatedAt)

	if err != nil {
		return nil, errors.New("course not found")
	}

	return &course, nil
}

// DeleteCourse удаляет курс
func (s *CourseService) DeleteCourse(courseID int64) error {
	result, err := s.db.Exec(context.Background(),
		"DELETE FROM courses WHERE id = $1",
		courseID,
	)

	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return errors.New("course not found")
	}

	return nil
}
