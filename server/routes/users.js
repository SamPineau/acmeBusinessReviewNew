const express = require('express');
const router = express.Router();
const { fetchReviewsByUserId, createReview, deleteReview } = require('../db'); 
const isLoggedIn = require('../middleware/isLoggedIn');

router.post('/businesses/:businessId/reviews', isLoggedIn, async (req, res, next) => {
    try {
        const { businessId } = req.params;
        const { comment, rating } = req.body;
        const userId = req.user.id; 
        const review = await createReview({ userId, businessId, comment, rating });
        res.json(review);
    } catch (error) {
        next(error);
    }
});

router.delete('/reviews/:reviewId', isLoggedIn, async (req, res, next) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user.id; 
        await deleteReview({ userId, reviewId });
        res.sendStatus(204); 
    } catch (error) {
        next(error);
    }
});

router.get('/:id/reviews', async (req, res, next) => {
    try {
        const { id } = req.params;
        const reviews = await fetchReviewsByUserId(id);
        res.json(reviews);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
