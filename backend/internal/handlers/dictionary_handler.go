package handlers

import (
	"english-learning/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type DictionaryHandler struct {
	dictionaryService *services.DictionaryService
}

func NewDictionaryHandler(dictionaryService *services.DictionaryService) *DictionaryHandler {
	return &DictionaryHandler{
		dictionaryService: dictionaryService,
	}
}

// GetWordInfoResponse ответ с информацией о слове
type GetWordInfoResponse struct {
	Word        string   `json:"word"`
	Phonetic    string   `json:"phonetic"`
	AudioURL    string   `json:"audio_url,omitempty"`
	Translation string   `json:"translation"` // Русский перевод
	Definition  string   `json:"definition"`
	Example     string   `json:"example,omitempty"`
	Meanings    []string `json:"meanings,omitempty"` // Все определения
}

// GetWordInfo получает информацию о слове из Dictionary API
// @Summary Получить информацию о слове
// @Description Получает информацию о слове из Free Dictionary API (определение, фонетика, пример, аудио)
// @Tags dictionary
// @Produce json
// @Param word path string true "Слово для поиска"
// @Success 200 {object} GetWordInfoResponse
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /dictionary/{word} [get]
func (h *DictionaryHandler) GetWordInfo(c *gin.Context) {
	word := c.Param("word")
	if word == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "слово не указано"})
		return
	}

	// Формируем базовый ответ
	response := GetWordInfoResponse{
		Word: word,
	}

	// Сначала пытаемся получить русский перевод из встроенного словаря
	translation, err := h.dictionaryService.TranslateToRussian(word)
	if err == nil {
		response.Translation = translation
	} else {
		// Логируем ошибку перевода
		println("Translation error for word", word, ":", err.Error())
	}

	// Пытаемся получить информацию из Dictionary API
	entry, err := h.dictionaryService.GetWordInfo(word)
	if err == nil {
		// Успешно получили данные из API
		response.Phonetic = entry.Phonetic

		// Получаем фонетику
		if response.Phonetic == "" && len(entry.Phonetics) > 0 {
			response.Phonetic = entry.Phonetics[0].Text
		}

		// Получаем аудио URL
		for _, phonetic := range entry.Phonetics {
			if phonetic.Audio != "" {
				response.AudioURL = phonetic.Audio
				break
			}
		}

		// Получаем первое определение
		if len(entry.Meanings) > 0 && len(entry.Meanings[0].Definitions) > 0 {
			response.Definition = entry.Meanings[0].Definitions[0].Definition
			
			// Получаем пример
			if entry.Meanings[0].Definitions[0].Example != "" {
				response.Example = entry.Meanings[0].Definitions[0].Example
			}
		}

		// Собираем все определения
		var allMeanings []string
		for _, meaning := range entry.Meanings {
			for _, def := range meaning.Definitions {
				if def.Definition != "" {
					allMeanings = append(allMeanings, def.Definition)
				}
			}
		}
		response.Meanings = allMeanings

		// Если перевода не было, используем английское определение
		if response.Translation == "" && response.Definition != "" {
			response.Translation = "📖 " + response.Definition
		}
	} else {
		// API не ответил, но у нас может быть перевод
		if response.Translation == "" {
			response.Translation = "Перевод не найден"
		}
	}

	// Всегда возвращаем 200, даже если не все данные получены
	c.JSON(http.StatusOK, response)
}
