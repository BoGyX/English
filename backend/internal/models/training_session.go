package models

import (
	"time"

	"github.com/google/uuid"
)

// TrainingSession представляет сессию тренировки
type TrainingSession struct {
	ID         int64      `json:"id" db:"id"`
	UserID     *uuid.UUID `json:"user_id,omitempty" db:"user_id"`
	CourseID   *int64     `json:"course_id,omitempty" db:"course_id"`
	DeckID     *int64     `json:"deck_id,omitempty" db:"deck_id"`
	StartedAt  time.Time  `json:"started_at" db:"started_at"`
	FinishedAt *time.Time `json:"finished_at,omitempty" db:"finished_at"`
}

// TrainingAnswer представляет ответ на карточку в сессии
type TrainingAnswer struct {
	ID         int64     `json:"id" db:"id"`
	SessionID  int64     `json:"session_id" db:"session_id"`
	CardID     *int64    `json:"card_id,omitempty" db:"card_id"`
	IsCorrect  *bool     `json:"is_correct,omitempty" db:"is_correct"`
	AnsweredAt time.Time `json:"answered_at" db:"answered_at"`
}
