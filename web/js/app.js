import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Redirect, Link, Switch } from 'react-router-dom'
import { Layout, Menu, Icon } from 'antd'
import * as firebase from 'firebase/app'
import 'firebase/auth'

firebase.initializeApp({
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
})

const { Content, Footer } = Layout
import Header from './Header'

import 'antd/dist/antd.css'
import 'ant-design-pro/dist/ant-design-pro.css'
import '../css/app.css'
import LoginPage from './auth/LoginPage'
import NotFoundPage from './NotFoundPage'
import AppContext from './AppContext'

class App extends React.Component {
  componentWillMount() {
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        user.getIdToken(true)
          .then(token => {
            this.props.auth.setAuth({
              idToken: token,
              displayName: user.displayName
            })
          })
          .catch(err => {
            console.error('failed to get id token', err)
          })
      } else {
        this.props.auth.setAuth(null)
        console.info('AUTH STATE LOGGED OUT')
      }
    })
  }

  render() {
    return (
      <Layout>
        <Router>
          <React.Fragment>
            <Header />

            <Content style={{ padding: '0 50px' }}>
              <Switch>
                <Route path="/auth/login" exact component={LoginPage} />
                <Route component={NotFoundPage} />
              </Switch>
            </Content>

            <Footer>&copy; Finances 2019</Footer>
          </React.Fragment>
        </Router>
      </Layout>
    )
  }
}

class Wrapper extends React.Component {
  constructor(params) {
    super(params)

    this.state = {
      auth: {
        displayName: '',
        idToken: '',
      },
      setAuth: (data) => {
        if (data.displayName && data.idToken) {
          this.setState({
            auth: {
              displayName: data.displayName,
              idToken: data.idToken
            }
          })
        } else {
          this.setState({
            auth: {
              displayName: null,
              idToken: null
            }
          })
        }
      }
    }
  }

  render() {
    return (
      <AppContext.Provider value={this.state}>
        <AppContext.Consumer>
          {auth => {
            return <App auth={auth} />
          }}
        </AppContext.Consumer>
      </AppContext.Provider>
    )
  }
}

ReactDOM.render(
  <Wrapper />,
  document.getElementById('app')
)
