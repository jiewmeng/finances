import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom'
import * as firebase from 'firebase/app'
import 'firebase/auth'

import 'app/css/normalize.css'
import 'app/assets/fonts/material-icons/material-icons.css'
import 'app/css/app.css'
import 'app/css/topbar.css'

import Topbar from 'app/scripts/app/Topbar'
import Dashboard from 'app/scripts/Dashboard'
import Login from 'app/scripts/auth/Login'
import initConfig from 'app/scripts/config'

import AppContext from 'app/scripts/AppContext'

const config = initConfig()
console.log(config)
firebase.initializeApp(config.firebase)

class App extends React.Component {
  constructor(params) {
    super(params)

    this.state = {
      uid: undefined,
      setState: this.setState.bind(this)
    }
  }

  componentDidMount() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        // console.log('User is logged in', user)
        this.setState({
          uid: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL
        })
      } else {
        // console.log('Unauthenticated')
        this.setState({
          uid: undefined,
          displayName: undefined,
          photoURL: undefined
        })
      }
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
