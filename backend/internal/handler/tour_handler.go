package handler

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Изменяю обработчик списка туров, добавляя поддержку поиска по названию
func (h *Handler) List(c *gin.Context) {
	fmt.Println("DEBUG: Entering handler.List") // Добавляем лог входа в обработчик
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

	// Обрабатываем минимальную продолжительность
	if durationMinStr := c.Query("durationMin"); durationMinStr != "" {
		durationMin, err := strconv.Atoi(durationMinStr)
		if err == nil && durationMin > 0 {
			filters["duration_min"] = durationMin
		}
	}

	// Обрабатываем максимальную продолжительность
	if durationMaxStr := c.Query("durationMax"); durationMaxStr != "" {
		durationMax, err := strconv.Atoi(durationMaxStr)
		if err == nil && durationMax > 0 {
			filters["duration_max"] = durationMax
		}
	}

	// Обрабатываем дату начала "после"
	if startDateAfter := c.Query("startDateAfter"); startDateAfter != "" {
		// TODO: Добавить валидацию формата даты, если необходимо
		filters["start_date_after"] = startDateAfter
	}

	// Обрабатываем дату начала "до"
	if startDateBefore := c.Query("startDateBefore"); startDateBefore != "" {
		// TODO: Добавить валидацию формата даты, если необходимо
		filters["start_date_before"] = startDateBefore
	}

	// Обрабатываем параметры сортировки
	if sortBy := c.Query("sortBy"); sortBy != "" {
		// Валидация допустимых полей для сортировки
		allowedSortBy := map[string]string{
			"price":    "t.base_price",
			"duration": "t.duration",
			"name":     "t.name",
			// Добавьте другие поля при необходимости
		}
		if dbField, ok := allowedSortBy[sortBy]; ok {
			filters["sort_by"] = dbField
			sortOrder := c.DefaultQuery("sortOrder", "asc")
			if sortOrder != "asc" && sortOrder != "desc" {
				sortOrder = "asc" // По умолчанию asc
			}
			filters["sort_order"] = sortOrder
		}
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
