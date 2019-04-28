import React from 'react';
import Home from './HomeComponent';
import { Route, Redirect, Switch } from 'react-router-dom';
import { withRouter } from 'react-router';
import Search from './SearchComponent';

function Main() {
  return (
    <div>
      <Switch>
        <Route path="/home" component={Home} />
        <Route path="/search" component={Search} />
        <Route exact path="/" render={() => (<Redirect to="/home" />)} />
      </Switch>

      {/* <Footer /> */}
    </div>
  );
}

export default withRouter(Main);