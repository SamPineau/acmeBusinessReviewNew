import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import BusinessList from './BusinessList';
import BusinessDetails from './BusinessDetails';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Switch>
        <Route exact path="/" component={BusinessList} />
        <Route path="/businesses/:id" component={BusinessDetails} />
      </Switch>
    </Router>
  </React.StrictMode>,
  document.getElementById('root')
);


