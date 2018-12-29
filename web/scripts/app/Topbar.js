import React from 'react'
import { Link } from 'react-router-dom'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import Icon from '@material-ui/core/Icon'
import Typography from '@material-ui/core/Typography'
import Avatar from '@material-ui/core/Avatar'
import Tooltip from '@material-ui/core/Tooltip'
import Menu from '@material-ui/core/Menu'
import MenuItem from '@material-ui/core/MenuItem'
import * as firebase from 'firebase/app'
import 'firebase/auth'

import AppContext from 'app/scripts/AppContext'

export default class Topbar extends React.Component {
  constructor(params) {
    super(params)

    this.state = {
      userMenuEl: undefined
    }
  }

  openUserMenu = (event) => {
    this.setState({
      userMenuEl: event.currentTarget
    })
  }

  closeUserMenu = () => {
    this.setState({
      userMenuEl: undefined
    })
  }

  logout = () => {
    firebase.auth().signOut()
  }

  render() {
    return (
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" color="inherit" className="topbar-title">
            Finances
          </Typography>
          <AppContext.Consumer>
            {({ uid, displayName, photoURL }) => {
              if (uid) {
                return (
                  <React.Fragment>
                    <IconButton color="inherit">
                      <Icon>cloud_upload</Icon>
                    </IconButton>
                    <IconButton color="inherit">
                      <Icon>view_list</Icon>
                    </IconButton>
                    <Tooltip title={`Logged in as ${displayName}`}>
                      <IconButton onClick={this.openUserMenu}>
                        <Avatar alt={displayName} src={photoURL} />
                      </IconButton>
                    </Tooltip>
                    <Menu id="user-menu" anchorEl={this.state.userMenuEl} open={Boolean(this.state.userMenuEl)} onClose={this.closeUserMenu}>
                      <MenuItem onClick={this.logout}>Logout</MenuItem>
                    </Menu>
                  </React.Fragment>
                )
              }

              return (
                <IconButton color="inherit">
                  <Link to="/auth/login" className="link-icon">
                    <Icon>account_box</Icon>
                 </Link>
                </IconButton>
              )
            }}
          </AppContext.Consumer>
        </Toolbar>
      </AppBar>
    )
  }
}
