import React from 'react'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles'
import * as firebase from 'firebase/app'

const styles = theme => ({
})

class Login extends React.Component {
  doLogin = async () => {
    const googleProvider = new firebase.auth.GoogleAuthProvider()
    await firebase.auth().signInWithPopup(googleProvider)
  }

  render() {
    return (
      <div className="content-wrapper">
        <Paper elevation={1} className="paper-wrapper">
          <Button variant="contained" color="primary" onClick={() => this.doLogin()}>
            Login with Google
          </Button>
        </Paper>
      </div>
    )
  }
}

export default withStyles(styles)(Login)
