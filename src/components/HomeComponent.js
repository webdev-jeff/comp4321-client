import React, { Component } from 'react';
import { NavLink, NavItem, Nav } from 'reactstrap';

class Home extends Component {

  render() {
    return (
      <div className="container-fluid pl-0 pr-0">
        <div className="row align-items-center banner banner-1 ml-0 mr-0 pl-0 pr-0">
          <div className="col-12 text-center title-bottom">
            <p className="font-weight-bold title-large text-center mb-0 text-white">COMP4321</p>
            <div className="homepage_btn_wrapper">
              <Nav className="align-items-center">
                <NavItem>
                  <NavLink href="/search" className="btn btn-outline-light">
                    Search
                  </NavLink>
                </NavItem>
              </Nav>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Home;