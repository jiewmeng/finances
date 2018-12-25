import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom'

import 'app/css/normalize.css'
import 'app/assets/fonts/material-icons/material-icons.css'
import 'app/css/app.css'
import 'app/css/topbar.css'

import Topbar from 'app/scripts/app/Topbar'
import Dashboard from 'app/scripts/Dashboard'

const App = () => {
  return (
    <div>
      <Router>
        <React.Fragment>
          <Topbar />

          <Switch>
            <Route component={Dashboard} />
          </Switch>
        </React.Fragment>
      </Router>
    </div>
  )
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
)
