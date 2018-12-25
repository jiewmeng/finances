import React from 'react'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'

export default function Dashboard() {
  return (
    <div className="content-wrapper">
      <Paper elevation={1} className="paper-wrapper">
        <Typography variant="h6">
          Dashboard
        </Typography>
      </Paper>
    </div>
  )
}
