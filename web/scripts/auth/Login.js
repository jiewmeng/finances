import React from 'react'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import classNames from 'classnames'
import { withStyles } from '@material-ui/core/styles'

const styles = theme => ({
  textField: {
    marginTop: 10,
    marginBottom: 20
  }
})

class Login extends React.Component {
  render() {
    const { classes, className } = this.props

    return (
      <div className="content-wrapper">
        <Paper elevation={1} className="paper-wrapper">
          <Typography variant="h6">
            Login
          </Typography>

          <div className="login-form-wrapper">
            <TextField label="Email" variant="filled" margin="normal" className={classNames(classes.textField)} fullWidth />
            <TextField label="Password" type="password" variant="filled"  margin="normal" className={classNames(classes.textField)} fullWidth />

            <Button variant="contained" color="primary">Login</Button>
          </div>
        </Paper>
      </div>
    )
  }
}

export default withStyles(styles)(Login)
