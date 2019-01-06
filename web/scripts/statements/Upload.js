import React from 'react'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import Icon from '@material-ui/core/Icon'
import classNames from 'classnames'
import { withStyles } from '@material-ui/core/styles'

import * as firebase from 'firebase/app'
import 'firebase/storage'

class Upload extends React.Component {
  constructor(params) {
    super(params)

    this.uploadInput = React.createRef()
  }

  componentDidMount() {
    this.uploadInput.current.addEventListener('change', () => {
      console.log('files', this.uploadInput.current.files)
      const user = firebase.auth().currentUser
      if (this.uploadInput.current.files) {
        const file = this.uploadInput.current.files[0]
        const upload = firebase.storage().ref().child(`${user.uid}/${file.name}`).put(file)
        upload.on('state_changed', (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          console.log(`Uploading ... ${progress}%`)
        }, (err) => {
          console.log(`Upload failed: ${err.message}`)
        }, () => {
          console.log(`Successfully uploaded`)
        })
      }
    })
  }

  openUploadDialog = () => {
    this.uploadInput.current.click()
  }

  render() {
    const { classes } = this.props

    return (
      <div className="content-wrapper">
        <Paper elevation={1} className="paper-wrapper">
          <Typography variant="h6" className={classNames([classes.header])}>
            Upload Statement
          </Typography>

          <Button variant="contained" color="primary" onClick={this.openUploadDialog}>
            <Icon className="button-icon">cloud_upload</Icon>
            Upload Statement
          </Button>
          <input type="file" accept="application/pdf" ref={this.uploadInput} className="hide" />
        </Paper>
      </div>
    )
  }
}

const styles = {
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #e0e0e0',
    lineHeight: '46px'
  }
}

export default withStyles(styles)(Upload)
