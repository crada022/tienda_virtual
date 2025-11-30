// src/api/services/reviewService.js
import api from "../axios";

const reviewService = {
  createReview: (data) => api.post("/reviews", data),

  getProductReviews: (productId) =>
    api.get(`/reviews/products/${productId}`),

  getStoreReviews: (storeId) =>
    api.get(`/reviews/stores/${storeId}`),

  getUserReviews: (userId) =>
    api.get(`/reviews/users/${userId}`)
};

export default reviewService;
