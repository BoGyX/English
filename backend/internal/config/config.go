package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Database DatabaseConfig
	JWT      JWTConfig
	Server   ServerConfig
	Moodle   MoodleConfig
}

type JWTConfig struct {
	Secret      string
	ExpiryHours int
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

type ServerConfig struct {
	Port    string
	GINMode string
}

type MoodleConfig struct {
	Enabled    bool
	BaseURL    string
	Token      string
	Service    string
	AutoCreate bool   // Автоматически создавать пользователя в локальной БД при успешной авторизации через Moodle
	TestMode   bool   // Режим разработки - работает без реального Moodle сервера
}

func Load() *Config {
	// Загружаем .env файл (не критично если его нет)
	// Ищем .env в текущей директории (backend/)
	if err := godotenv.Load(); err != nil {
		// Не критично, если файла нет - используем значения по умолчанию
	}

	return &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "1"),
			Name:     getEnv("DB_NAME", "DiplomEnglish"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:      getEnv("JWT_SECRET", "change-this-secret-key-minimum-32-characters-long"),
			ExpiryHours: getEnvAsInt("JWT_EXPIRY_HOURS", 24),
		},
		Server: ServerConfig{
			Port:    getEnv("PORT", "8000"),
			GINMode: getEnv("GIN_MODE", "debug"),
		},
		Moodle: MoodleConfig{
			Enabled:    getEnvAsBool("MOODLE_ENABLED", true), // По умолчанию включено
			BaseURL:    getEnv("MOODLE_BASE_URL", ""),
			Token:      getEnv("MOODLE_TOKEN", ""),
			Service:    getEnv("MOODLE_SERVICE", "moodle_mobile_app"),
			AutoCreate: getEnvAsBool("MOODLE_AUTO_CREATE", true),
			TestMode:   getEnvAsBool("MOODLE_TEST_MODE", true), // По умолчанию тестовый режим
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}
