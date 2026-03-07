package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"english-learning/internal/config"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(cfg config.DatabaseConfig) (*pgxpool.Pool, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name, cfg.SSLMode,
	)

	log.Printf("📡 Подключение к БД: %s@%s:%s/%s", cfg.User, cfg.Host, cfg.Port, cfg.Name)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("не удалось создать пул подключений: %w", err)
	}

	// Проверяем подключение с таймаутом
	ctxPing, cancelPing := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelPing()

	if err := pool.Ping(ctxPing); err != nil {
		pool.Close()
		return nil, fmt.Errorf("не удалось подключиться к БД: %w. Проверьте параметры подключения в .env", err)
	}

	log.Printf("✅ Успешное подключение к БД")

	return pool, nil
}
