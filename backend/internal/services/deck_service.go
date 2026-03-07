package services

import (
	"context"
	"english-learning/internal/models"
	"errors"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DeckService struct {
	db *pgxpool.Pool
}

func NewDeckService(db *pgxpool.Pool) *DeckService {
	return &DeckService{db: db}
}

// GetAllDecks возвращает список всех decks
func (s *DeckService) GetAllDecks() ([]models.Deck, error) {
	rows, err := s.db.Query(context.Background(),
		"SELECT id, course_id, title, description, position, created_at FROM decks ORDER BY position ASC, created_at DESC",
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var decks []models.Deck
	for rows.Next() {
		var deck models.Deck
		err := rows.Scan(&deck.ID, &deck.CourseID, &deck.Title, &deck.Description, &deck.Position, &deck.CreatedAt)
		if err != nil {
			return nil, err
		}
		decks = append(decks, deck)
	}

	return decks, nil
}

// GetDeckByID возвращает deck по ID
func (s *DeckService) GetDeckByID(deckID int64) (*models.Deck, error) {
	var deck models.Deck
	err := s.db.QueryRow(context.Background(),
		"SELECT id, course_id, title, description, position, created_at FROM decks WHERE id = $1",
		deckID,
	).Scan(&deck.ID, &deck.CourseID, &deck.Title, &deck.Description, &deck.Position, &deck.CreatedAt)

	if err != nil {
		return nil, errors.New("deck not found")
	}

	return &deck, nil
}

// GetDecksByCourseID возвращает все decks для конкретного курса
func (s *DeckService) GetDecksByCourseID(courseID int64) ([]models.Deck, error) {
	rows, err := s.db.Query(context.Background(),
		"SELECT id, course_id, title, description, position, created_at FROM decks WHERE course_id = $1 ORDER BY position ASC, created_at DESC",
		courseID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var decks []models.Deck
	for rows.Next() {
		var deck models.Deck
		err := rows.Scan(&deck.ID, &deck.CourseID, &deck.Title, &deck.Description, &deck.Position, &deck.CreatedAt)
		if err != nil {
			return nil, err
		}
		decks = append(decks, deck)
	}

	return decks, nil
}

// CreateDeck создает новый deck
func (s *DeckService) CreateDeck(courseID int64, title string, description *string, position int) (*models.Deck, error) {
	var deck models.Deck
	err := s.db.QueryRow(context.Background(),
		`INSERT INTO decks (course_id, title, description, position)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, course_id, title, description, position, created_at`,
		courseID, title, description, position,
	).Scan(&deck.ID, &deck.CourseID, &deck.Title, &deck.Description, &deck.Position, &deck.CreatedAt)

	if err != nil {
		return nil, err
	}

	return &deck, nil
}

// UpdateDeck обновляет deck
func (s *DeckService) UpdateDeck(deckID int64, title string, description *string, position int) (*models.Deck, error) {
	var deck models.Deck
	err := s.db.QueryRow(context.Background(),
		`UPDATE decks 
		 SET title = $1, description = $2, position = $3
		 WHERE id = $4
		 RETURNING id, course_id, title, description, position, created_at`,
		title, description, position, deckID,
	).Scan(&deck.ID, &deck.CourseID, &deck.Title, &deck.Description, &deck.Position, &deck.CreatedAt)

	if err != nil {
		return nil, errors.New("deck not found")
	}

	return &deck, nil
}

// DeleteDeck удаляет deck
func (s *DeckService) DeleteDeck(deckID int64) error {
	result, err := s.db.Exec(context.Background(),
		"DELETE FROM decks WHERE id = $1",
		deckID,
	)

	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return errors.New("deck not found")
	}

	return nil
}
