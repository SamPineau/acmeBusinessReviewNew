const pg = require('pg');
const express = require('express');
const router = express.Router();
const app = express();
const { Pool } = require('pg');
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT = process.env.JWT || 'shhh';
const reviewRoutes = require('./routes/reviews'); 
const { fetchBusinesses } = require('../db');
const { fetchReviewsByBusinessId } = require('../db');
const { addToCart, removeFromCart, getCart } = require('../db');

app.use(express.json());
app.use('/api/reviews', reviewRoutes); 

if(JWT === 'shhh'){
  console.log('If deployed, set process.env.JWT to something other than shhh');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost/fsa_app_db',
  ssl: {
    rejectUnauthorized: false
  }
});

const addToCart = async (userId, itemId) => {
  try {
    const SQL = `
      INSERT INTO cart (user_id, item_id)
      VALUES ($1, $2);
    `;
    await pool.query(SQL, [userId, itemId]);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    throw error;
  }
};

const removeFromCart = async (userId, itemId) => {
  try {
    const SQL = `
      DELETE FROM cart
      WHERE user_id = $1 AND item_id = $2;
    `;
    await pool.query(SQL, [userId, itemId]);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    throw error;
  }
};

const getCart = async (userId) => {
  try {
    const SQL = `
      SELECT item_id
      FROM cart
      WHERE user_id = $1;
    `;
    const result = await pool.query(SQL, [userId]);
    return result.rows.map(row => row.item_id);
  } catch (error) {
    console.error('Error getting cart contents:', error);
    throw error;
  }
};

const createTables = async () => {
  try {
    const SQL = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        username VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS businesses (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        business_id UUID REFERENCES businesses(id),
        comment TEXT,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5)
      );
    `;
    await pool.query(SQL);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

const createUser = async({ username, password})=> {
  if(!username || !password){
    const error = Error('username and password required!');
    error.status = 401;
    throw error;
  }
  const SQL = `
    INSERT INTO users(id, username, password) VALUES($1, $2, $3) RETURNING *
  `;
  const response = await pool.query(SQL, [uuid.v4(), username, await bcrypt.hash(password, 5)]);
  return response.rows[0];
};

const authenticate = async({ username, password })=> {
  const SQL = `
    SELECT id, username, password FROM users WHERE username=$1;
  `;

  const response = await pool.query(SQL, [username]);
  if(!response.rows.length || (await bcrypt.compare(password, response.rows[0].password)) === false){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  const token = await jwt.sign({ id: response.rows[0].id}, JWT);
  return { token };
};

const findUserWithToken = async(token)=> {
  let id;
  try{
    const payload = await jwt.verify(token, JWT);
    id = payload.id;
  }
  catch(ex){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  const SQL = `
    SELECT id, username FROM users WHERE id=$1;
  `;
  const response = await pool.query(SQL, [id]);
  if(!response.rows.length){
    const error = Error('not authorized');
    error.status = 401;
    throw error;
  }
  return response.rows[0];
};

const fetchUsers = async()=> {
  const SQL = `
    SELECT id, username FROM users;
  `;
  const response = await pool.query(SQL);
  return response.rows;
};

router.get('/:id', async (req, res, next) => {
  try {
      const { id } = req.params;
      const reviews = await fetchReviewsByBusinessId(id); 
      res.json(reviews);
  } catch (error) {
      next(error);
  }
});

router.post('/checkout', async (req, res, next) => {
  try {
    // Extract form data from the request body
    const { userId, items, username, email, address, paymentMethod } = req.body;

    // Validate the form data
    if (!userId || !items || !username || !email || !address || !paymentMethod) {
      throw new Error('Please provide all required information for checkout.');
    }
    console.log('Checkout details:', { userId, items, username, email, address, paymentMethod });

    res.status(200).json({ message: 'Checkout successful!' });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

const fetchReviewsByBusinessId = async (businessId) => {

};

const fetchReviewsByUserId = async (userId) => {

};

const createReview = async ({ userId, businessId, comment, rating }) => {
  const SQL = `
      INSERT INTO reviews (user_id, business_id, comment, rating)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
  `;
  const response = await pool.query(SQL, [userId, businessId, comment, rating]);
  return response.rows[0];
};

const deleteReview = async ({ userId, reviewId }) => {
  const SQL = `
      DELETE FROM reviews
      WHERE id = $1 AND user_id = $2;
  `;
  await pool.query(SQL, [reviewId, userId]);
};

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

module.exports = {
  app,
  pool,
  createTables,
  createUser,
  fetchUsers,
  authenticate,
  findUserWithToken,
  fetchBusinesses,
  router,
  fetchReviewsByBusinessId,
  fetchReviewsByUserId,
  createReview,
  deleteReview,
  addToCart,
  removeFromCart,
  getCart
};

