package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"
)

// DictionaryService сервис для работы с Free Dictionary API
type DictionaryService struct {
	baseURL string
	client  *http.Client
}

// DictionaryEntry представляет ответ от Dictionary API
type DictionaryEntry struct {
	Word      string    `json:"word"`
	Phonetic  string    `json:"phonetic"`
	Phonetics []Phonetic `json:"phonetics"`
	Meanings  []Meaning  `json:"meanings"`
	Origin    string    `json:"origin"`
}

// Phonetic представляет фонетическую информацию
type Phonetic struct {
	Text  string `json:"text"`
	Audio string `json:"audio"`
}

// Meaning представляет значение слова
type Meaning struct {
	PartOfSpeech string       `json:"partOfSpeech"`
	Definitions  []Definition `json:"definitions"`
}

// Definition представляет определение слова
type Definition struct {
	Definition string   `json:"definition"`
	Example    string   `json:"example"`
	Synonyms   []string `json:"synonyms"`
	Antonyms   []string `json:"antonyms"`
}

// DictionaryError представляет ошибку от API
type DictionaryError struct {
	Title   string `json:"title"`
	Message string `json:"message"`
	Resolution string `json:"resolution"`
}

// NewDictionaryService создает новый сервис для работы с Dictionary API
func NewDictionaryService() *DictionaryService {
	return &DictionaryService{
		baseURL: "https://api.dictionaryapi.dev/api/v2/entries/en",
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// GetWordInfo получает информацию о слове из Dictionary API
func (s *DictionaryService) GetWordInfo(word string) (*DictionaryEntry, error) {
	if word == "" {
		return nil, errors.New("слово не может быть пустым")
	}

	// Формируем URL
	url := fmt.Sprintf("%s/%s", s.baseURL, word)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("ошибка создания запроса: %w", err)
	}

	req.Header.Set("Accept", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ошибка запроса к Dictionary API: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("ошибка чтения ответа: %w", err)
	}

	// Проверяем статус ответа
	if resp.StatusCode == http.StatusNotFound {
		var dictErr DictionaryError
		if err := json.Unmarshal(body, &dictErr); err == nil {
			return nil, fmt.Errorf("слово не найдено: %s", dictErr.Message)
		}
		return nil, errors.New("слово не найдено в словаре")
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ошибка Dictionary API: статус %d", resp.StatusCode)
	}

	// Парсим ответ (API возвращает массив)
	var entries []DictionaryEntry
	if err := json.Unmarshal(body, &entries); err != nil {
		return nil, fmt.Errorf("ошибка парсинга ответа: %w", err)
	}

	if len(entries) == 0 {
		return nil, errors.New("слово не найдено")
	}

	// Возвращаем первую запись
	return &entries[0], nil
}

// GetWordDefinition получает первое определение слова
func (s *DictionaryService) GetWordDefinition(word string) (string, error) {
	entry, err := s.GetWordInfo(word)
	if err != nil {
		return "", err
	}

	if len(entry.Meanings) == 0 {
		return "", errors.New("определение не найдено")
	}

	if len(entry.Meanings[0].Definitions) == 0 {
		return "", errors.New("определение не найдено")
	}

	return entry.Meanings[0].Definitions[0].Definition, nil
}

// GetWordExample получает первый пример использования слова
func (s *DictionaryService) GetWordExample(word string) (string, error) {
	entry, err := s.GetWordInfo(word)
	if err != nil {
		return "", err
	}

	// Ищем первый пример во всех значениях
	for _, meaning := range entry.Meanings {
		for _, def := range meaning.Definitions {
			if def.Example != "" {
				return def.Example, nil
			}
		}
	}

	return "", errors.New("пример не найден")
}

// GetWordPhonetic получает фонетику слова
func (s *DictionaryService) GetWordPhonetic(word string) (string, error) {
	entry, err := s.GetWordInfo(word)
	if err != nil {
		return "", err
	}

	// Используем основную фонетику или первую из массива
	if entry.Phonetic != "" {
		return entry.Phonetic, nil
	}

	if len(entry.Phonetics) > 0 && entry.Phonetics[0].Text != "" {
		return entry.Phonetics[0].Text, nil
	}

	return "", errors.New("фонетика не найдена")
}

// GetWordAudioURL получает URL аудио произношения
func (s *DictionaryService) GetWordAudioURL(word string) (string, error) {
	entry, err := s.GetWordInfo(word)
	if err != nil {
		return "", err
	}

	// Ищем первое доступное аудио
	for _, phonetic := range entry.Phonetics {
		if phonetic.Audio != "" {
			return phonetic.Audio, nil
		}
	}

	return "", errors.New("аудио не найдено")
}
