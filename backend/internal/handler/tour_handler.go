package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Изменяю обработчик списка туров, добавляя поддержку поиска по названию
func (h *Handler) List(c *gin.Context) {
	// Извлекаем и парсим параметры фильтрации
	var filters = make(map[string]interface{})

	// Обрабатываем ID страны
	if countryIDStr := c.Query("countryId"); countryIDStr != "" {
		countryID, err := strconv.Atoi(countryIDStr)
		if err == nil && countryID > 0 {
			filters["country_id"] = countryID
		}
	}

	// Обрабатываем ID города
	if cityIDStr := c.Query("cityId"); cityIDStr != "" {
		cityID, err := strconv.Atoi(cityIDStr)
		if err == nil && cityID > 0 {
			filters["city_id"] = cityID
		}
	}

	// Обрабатываем минимальную цену
	if priceMinStr := c.Query("priceMin"); priceMinStr != "" {
		priceMin, err := strconv.ParseFloat(priceMinStr, 64)
		if err == nil && priceMin >= 0 {
			filters["price_min"] = priceMin
		}
	}

	// Обрабатываем максимальную цену
	if priceMaxStr := c.Query("priceMax"); priceMaxStr != "" {
		priceMax, err := strconv.ParseFloat(priceMaxStr, 64)
		if err == nil && priceMax > 0 {
			filters["price_max"] = priceMax
		}
	}

	// Добавляем поиск по названию
	if searchQuery := c.Query("searchQuery"); searchQuery != "" {
		filters["search_query"] = searchQuery
	}

	// Извлекаем параметры пагинации
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	size, _ := strconv.Atoi(c.DefaultQuery("size", "10"))

	// Получаем туры с учетом фильтрации и пагинации
	tours, total, err := h.services.Tour.List(c.Request.Context(), filters, page, size)
	if err != nil {
		newErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Формируем и возвращаем ответ
	c.JSON(http.StatusOK, gin.H{
		"tours": tours,
		"pagination": gin.H{
			"page":  page,
			"size":  size,
			"total": total,
		},
	})
}
