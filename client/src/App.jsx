import { useState, useEffect } from 'react'
import { Link, Route, Routes } from 'react-router-dom';
import Users from './Users';
import Businesses from './Businesses';
import CreateReview from './CreateReview';
import Home from './Home';

function App() {
  const [auth, setAuth] = useState({});
  const [users, setUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(()=> {
    attemptLoginWithToken();
    fetchUsers(); 
  }, []);

  const attemptLoginWithToken = async()=> {
    const token = window.localStorage.getItem('token');
    if(token){
      const response = await fetch(`/api/auth/me`, {
        headers: {
          authorization: token
        }
      });
      const json = await response.json();
      if(response.ok){
        setAuth(json);
      }
      else {
        window.localStorage.removeItem('token');
      }
    }
  };

  const authAction = async(credentials, mode)=> {
    const response = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(credentials),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const json = await response.json();
    if(response.ok){
      window.localStorage.setItem('token', json.token);
      attemptLoginWithToken();
    }
    else {
      throw json;
    }
  };

  const logout = ()=> {
    window.localStorage.removeItem('token');
    setAuth({});
  };

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/businesses');
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data); 
      } else {
        console.error('Failed to fetch businesses');
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users'); 
      if (response.ok) {
        const data = await response.json();
        setUsers(data); 
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  return (
    <>
      <h1>Acme Business Reviews</h1>
      <nav>
        <Link to='/'>Home</Link>
        <Link to='/businesses'>Businesses ({ businesses.length })</Link>
        <Link to='/users'>Users ({ users.length })</Link>
        {
          auth.id ? <Link to='/createReview'>Create Review</Link> : <Link to='/'>Register/Login</Link>
        }
     </nav>
    {
      auth.id && <button onClick={ logout }>Logout { auth.username }</button>
    }
      <Routes>
        <Route path='/' element={
          <Home
            authAction = { authAction }
            auth = { auth }
            businesses = { businesses }
            users = { users }
            reviews = { reviews }
          />
        } />
        <Route path='/businesses' element={<Businesses businesses={ businesses } />} />
        <Route path='/users' element={<Users users={ users}/>} />
        {
          !!auth.id && <Route path='/createReview' element={<CreateReview />} />
        }
      </Routes>
    </>
  )
}

export default App
