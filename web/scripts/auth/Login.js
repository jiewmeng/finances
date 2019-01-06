import React from 'react'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'
import * as firebase from 'firebase/app'
import { Redirect } from 'react-router-dom'
import AppContext from 'app/scripts/AppContext'

const styles = theme => ({
})

class Login extends React.Component {
  doLogin = async () => {
    const googleProvider = new firebase.auth.GoogleAuthProvider()
    await firebase.auth().signInWithPopup(googleProvider)
  }

  render() {
    return (
      <AppContext.Consumer>
        {({ uid }) => {
          if (uid) {
            if (this.props.location.state && this.props.location.state.redirectUrl) {
              return <Redirect to={this.props.location.state.redirectUrl} />
            } else {
              return <Redirect to="/" />
            }
          }

          return (
            <div className="content-wrapper">
              <Paper elevation={1} className="paper-wrapper">
                <Button variant="contained" color="primary" onClick={() => this.doLogin()}>
                  Login with Google
                </Button>
              </Paper>
            </div>
          )
        }}
      </AppContext.Consumer>
    )
  }
}

export default withStyles(styles)(Login)
