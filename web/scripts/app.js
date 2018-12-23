import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom'

import 'app/css/normalize.css'
import 'app/css/app.css'

import Test1 from 'app/scripts/test/Test1'
import Test2 from 'app/scripts/test/Test2'
import Default from 'app/scripts/test/Default'

const App = () => {
  return (
    <div>
      <h1>Finances</h1>
      <Router>
        <React.Fragment>
          <ul>
            <li>
              <Link to="/test1">Test 1</Link>
            </li>
            <li>
              <Link to="/test2">Test 2</Link>
            </li>
          </ul>

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
