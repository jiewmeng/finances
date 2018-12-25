import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom'

import 'app/css/normalize.css'
import 'app/assets/fonts/material-icons/material-icons.css'
import 'app/css/app.css'
import 'app/css/topbar.css'

import Topbar from 'app/scripts/app/Topbar'
import Test1 from 'app/scripts/test/Test1'
import Test2 from 'app/scripts/test/Test2'
import Default from 'app/scripts/test/Default'

const App = () => {
  return (
    <div>
      <Router>
        <React.Fragment>
          <Topbar />

          <Switch>
            <Route path="/test1" component={Test1} />
            <Route path="/test2" component={Test2} />
            <Route component={Default} />
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
