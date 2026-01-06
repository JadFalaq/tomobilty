import apiClient, { handleApiError } from '../utils/apiClient';

export const reviewService = {
  async getReviews(params = {}) {
    try {
      const response = await apiClient.get('/reviews', { params });
      if (response.data.success) {
        return {
          success: true,
          reviews: response.data.data.reviews,
          averageRating: response.data.data.average_rating,
          pagination: response.data.data.pagination,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getCarReviews(carId, params = {}) {
    try {
      const response = await apiClient.get(`/reviews/car/${carId}`, { params });
      if (response.data.success) {
        return {
          success: true,
          reviews: response.data.data.reviews,
          averageRating: response.data.data.average_rating,
          ratingDistribution: response.data.data.rating_distribution,
          pagination: response.data.data.pagination,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async createReview(data) {
    try {
      const response = await apiClient.post('/reviews', {
        car_id: data.carId,
        rating: data.rating,
        comment: data.comment,
      });
      return {
        success: response.data.success,
        message: response.data.message,
        review: response.data.data?.review,
      };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async getMyReviews(params = {}) {
    try {
      const response = await apiClient.get('/reviews/my-reviews', { params });
      if (response.data.success) {
        return {
          success: true,
          reviews: response.data.data.reviews,
          pagination: response.data.data.pagination,
        };
      }
      return { success: false, error: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async updateReview(reviewId, data) {
    try {
      const response = await apiClient.put(`/reviews/${reviewId}`, {
        rating: data.rating,
        comment: data.comment,
      });
      return {
        success: response.data.success,
        message: response.data.message,
        review: response.data.data?.review,
      };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  async deleteReview(reviewId) {
    try {
      const response = await apiClient.delete(`/reviews/${reviewId}`);
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },
};
