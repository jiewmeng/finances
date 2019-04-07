import React from 'react'
import { Button, Typography } from 'antd'
import * as firebase from 'firebase/app'
import 'firebase/auth'

const { Title } = Typography

import './auth.css'

export default class LoginPage extends React.Component {
  login = async () => {
    const googleProvider = new firebase.auth.GoogleAuthProvider()
    await firebase.auth().signInWithPopup(googleProvider)
  }

  render() {
    return (
      <div className="layout-blank-wrapper">
        <Title>Login</Title>

        <p className="auth-login-space">Login or signup using Google</p>

        <Button icon="google" size="large" type="primary" block onClick={this.login}>Login using Google</Button>
      </div>
    )
  }
}
