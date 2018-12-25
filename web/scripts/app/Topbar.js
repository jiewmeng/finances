import React from 'react'
import { Link } from 'react-router-dom'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import Icon from '@material-ui/core/Icon'
import Typography from '@material-ui/core/Typography'

export default function Topbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" color="inherit" className="topbar-title">
          Finances
        </Typography>
        <IconButton color="inherit">
          <Icon>cloud_upload</Icon>
        </IconButton>
        <IconButton color="inherit">
          <Icon>view_list</Icon>
        </IconButton>
      </Toolbar>
    </AppBar>
  )
}
