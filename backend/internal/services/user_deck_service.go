package services

import (
	"context"
	"english-learning/internal/models"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserDeckService struct {
	db *pgxpool.Pool
}

func NewUserDeckService(db *pgxpool.Pool) *UserDeckService {
	return &UserDeckService{db: db}
}

// GetAllUserDecks возвращает все записи прогресса пользователей по декам
func (s *UserDeckService) GetAllUserDecks() ([]models.UserDeck, error) {
	rows, err := s.db.Query(context.Background(),
		`SELECT id, user_id, deck_id, user_course_id, status, learned_cards_count, 
		 total_cards_count, progress_percentage, started_at, completed_at, created_at, updated_at 
		 FROM user_decks ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userDecks []models.UserDeck
	for rows.Next() {
		var ud models.UserDeck
		err := rows.Scan(&ud.ID, &ud.UserID, &ud.DeckID, &ud.UserCourseID, &ud.Status,
			&ud.LearnedCardsCount, &ud.TotalCardsCount, &ud.ProgressPercentage,
			&ud.StartedAt, &ud.CompletedAt, &ud.CreatedAt, &ud.UpdatedAt)
		if err != nil {
			return nil, err
		}
		userDecks = append(userDecks, ud)
	}

	return userDecks, rows.Err()
}

// GetUserDeckByID возвращает прогресс по деку по ID
func (s *UserDeckService) GetUserDeckByID(id int64) (*models.UserDeck, error) {
	var ud models.UserDeck
	err := s.db.QueryRow(context.Background(),
		`SELECT id, user_id, deck_id, user_course_id, status, learned_cards_count, 
		 total_cards_count, progress_percentage, started_at, completed_at, created_at, updated_at 
		 FROM user_decks WHERE id = $1`,
		id,
	).Scan(&ud.ID, &ud.UserID, &ud.DeckID, &ud.UserCourseID, &ud.Status,
		&ud.LearnedCardsCount, &ud.TotalCardsCount, &ud.ProgressPercentage,
		&ud.StartedAt, &ud.CompletedAt, &ud.CreatedAt, &ud.UpdatedAt)

	if err != nil {
		return nil, errors.New("user deck not found")
	}

	return &ud, nil
}

// GetUserDecksByUserID возвращает все деки пользователя
func (s *UserDeckService) GetUserDecksByUserID(userID uuid.UUID) ([]models.UserDeck, error) {
	rows, err := s.db.Query(context.Background(),
		`SELECT id, user_id, deck_id, user_course_id, status, learned_cards_count, 
		 total_cards_count, progress_percentage, started_at, completed_at, created_at, updated_at 
		 FROM user_decks WHERE user_id = $1 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userDecks []models.UserDeck
	for rows.Next() {
		var ud models.UserDeck
		err := rows.Scan(&ud.ID, &ud.UserID, &ud.DeckID, &ud.UserCourseID, &ud.Status,
			&ud.LearnedCardsCount, &ud.TotalCardsCount, &ud.ProgressPercentage,
			&ud.StartedAt, &ud.CompletedAt, &ud.CreatedAt, &ud.UpdatedAt)
		if err != nil {
			return nil, err
		}
		userDecks = append(userDecks, ud)
	}

	return userDecks, rows.Err()
}

// StartDeck создает новую запись о начале деки пользователем
func (s *UserDeckService) StartDeck(userID uuid.UUID, deckID int64, userCourseID *int64) (*models.UserDeck, error) {
	// Получаем количество карточек в деку
	var totalCards int
	err := s.db.QueryRow(context.Background(),
		"SELECT COUNT(*) FROM cards WHERE deck_id = $1",
		deckID,
	).Scan(&totalCards)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	var ud models.UserDeck
	err = s.db.QueryRow(context.Background(),
		`INSERT INTO user_decks (user_id, deck_id, user_course_id, status, learned_cards_count, 
		 total_cards_count, progress_percentage, started_at, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 RETURNING id, user_id, deck_id, user_course_id, status, learned_cards_count, 
		 total_cards_count, progress_percentage, started_at, completed_at, created_at, updated_at`,
		userID, deckID, userCourseID, "in_progress", 0, totalCards, 0.0, &now, now, now,
	).Scan(&ud.ID, &ud.UserID, &ud.DeckID, &ud.UserCourseID, &ud.Status,
		&ud.LearnedCardsCount, &ud.TotalCardsCount, &ud.ProgressPercentage,
		&ud.StartedAt, &ud.CompletedAt, &ud.CreatedAt, &ud.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return &ud, nil
}

// UpdateUserDeck обновляет прогресс пользователя по деку
func (s *UserDeckService) UpdateUserDeck(id int64, status string, learnedCardsCount int, totalCardsCount int, progressPercentage float64) (*models.UserDeck, error) {
	var ud models.UserDeck
	var completedAt *time.Time

	// Если статус completed, устанавливаем completed_at
	if status == "completed" {
		now := time.Now()
		completedAt = &now
	}

	err := s.db.QueryRow(context.Background(),
		`UPDATE user_decks 
		 SET status = $1, learned_cards_count = $2, total_cards_count = $3, 
		 progress_percentage = $4, completed_at = $5, updated_at = $6
		 WHERE id = $7
		 RETURNING id, user_id, deck_id, user_course_id, status, learned_cards_count, 
		 total_cards_count, progress_percentage, started_at, completed_at, created_at, updated_at`,
		status, learnedCardsCount, totalCardsCount, progressPercentage, completedAt, time.Now(), id,
	).Scan(&ud.ID, &ud.UserID, &ud.DeckID, &ud.UserCourseID, &ud.Status,
		&ud.LearnedCardsCount, &ud.TotalCardsCount, &ud.ProgressPercentage,
		&ud.StartedAt, &ud.CompletedAt, &ud.CreatedAt, &ud.UpdatedAt)

	if err != nil {
		return nil, errors.New("user deck not found")
	}

	return &ud, nil
}

// DeleteUserDeck удаляет запись о прогрессе по деку
func (s *UserDeckService) DeleteUserDeck(id int64) error {
	result, err := s.db.Exec(context.Background(),
		"DELETE FROM user_decks WHERE id = $1",
		id,
	)

	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return errors.New("user deck not found")
	}

	return nil
}
