const express = require('express');
const app = express();
const { createTables, createUser, fetchUsers, authenticate, findUserWithToken, addToCart, removeFromCart, getCart } = require('./db');
const { SingleProduct, Cart } = require('./components');
const { products, cartItems } = require('./dummyData');
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const path = require('path');

require('./index.css');

app.use(express.json());

app.get('/products/:productId', (req, res) => {
  const { productId } = req.params;
  const product = products.find((product) => product.id === parseInt(productId));
  res.send(`<h1>Product Details</h1>${SingleProduct(product)}`);
});

app.get('/cart', (req, res) => {
  res.send(`<h1>Shopping Cart</h1>${Cart(cartItems)}`);
});

app.post('/api/cart/add', async (req, res, next) => {
  try {
    const { userId, itemId } = req.body;
    await addToCart(userId, itemId);
    res.status(200).send('Item added to cart successfully');
  } catch (error) {
    next(error);
  }
});

app.post('/api/cart/remove', async (req, res, next) => {
  try {
    const { userId, itemId } = req.body;
    await removeFromCart(userId, itemId);
    res.status(200).send('Item removed from cart successfully');
  } catch (error) {
    next(error);
  }
});

app.get('/api/cart', async (req, res, next) => {
  try {
    const { userId } = req.query;
    const cartContents = await getCart(userId);
    res.json(cartContents);
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);

app.use('/api/reviews', reviewRoutes);

app.get('/users/:id/reviews', async (req, res, next) => {
  try {
      const { id } = req.params;
      const reviews = await fetchReviewsByUserId(id);
      res.json(reviews);
  } catch (error) {
      next(error);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).send({ error: err.message || 'Internal Server Error' });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
app.use('/assets', express.static(path.join(__dirname, '../client/dist/assets')));

const isLoggedIn = async (req, res, next) => {
  try{
    req.user = await findUserWithToken(req.headers.authorization);
    next();
  }
  catch(ex){
    next(ex);
  }
};

app.post('/api/auth/login', async(req, res, next)=> {
  try {
    res.send(await authenticate(req.body));
  }
  catch(ex){
    next(ex);
  }
});

app.post('/api/auth/register', async(req, res, next)=> {
  try {
    const user = await createUser(req.body);
    res.send(await authenticate(req.body));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth/me', isLoggedIn, (req, res, next)=> {
  try {
    res.send(req.user);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users', async(req, res, next)=> {
  try {
    res.send(await fetchUsers());
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message ? err.message : err });
});

const init = async () => {
  const port = process.env.PORT || 3000;
  await createTables();
  console.log('Tables created');
  app.listen(port, () => console.log(`Server is listening on port ${port}`));
};

init();

module.exports = app;


