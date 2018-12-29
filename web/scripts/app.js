import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom'

import 'app/css/normalize.css'
import 'app/assets/fonts/material-icons/material-icons.css'
import 'app/css/app.css'
import 'app/css/topbar.css'

import Topbar from 'app/scripts/app/Topbar'
import Dashboard from 'app/scripts/Dashboard'
import Login from 'app/scripts/auth/Login'

import AppContext from 'app/scripts/AppContext'

class App extends React.Component {
  constructor(params) {
    super(params)

    this.state = {
      token: undefined,
      expiry: undefined,
      setToken: this.setToken.bind(this)
    }
  }

  setToken(token, expiry) {
    this.setState({
      token,
      expiry
    })
  }

  render() {
    return (
      <AppContext.Provider value={this.state}>
        <Router>
          <React.Fragment>
            <Topbar />

            <Switch>
              <Route paht="/auth/login" component={Login} />
              <Route component={Dashboard} />
            </Switch>
          </React.Fragment>
        </Router>
      </AppContext.Provider>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
)
