import React from 'react'
import Paper from '@material-ui/core/Paper'
import classNames from 'classnames'
import { withStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Typography from '@material-ui/core/Typography'
import * as firebase from 'firebase'


class Dashboard extends React.Component {
  constructor(params) {
    super(params)

    this.state = {
      isGettingAggregations: false,
      aggregations: [],
      error: undefined
    }
  }

  componentWillMount() {
    const db = firebase.firestore()
    const currUser = firebase.auth().currentUser

    this.setState({ isGettingAggregations: true, error: undefined })
    db.collection(`users/${currUser.uid}/aggregations`)
      .orderBy('date', 'desc')
      .limit(100)
      .get()
      .then(aggregations => {
        const data = []
        aggregations.forEach(agg => {
          data.push(agg.data())
        })
        console.log(data)

        this.setState({
          isGettingAggregations: false,
          aggregations: data
        })
      })
      .catch(err => {
        this.setState({
          isGettingAggregations: false,
          error: err.message
        })
      })
  }

  render() {
    const { classes } = this.props
    const { isGettingAggregations, aggregations, error } = this.state
    let content

    if (isGettingAggregations) {
      content = <div>Loading ...</div>
    } else if (error) {
      content = <div>{error}</div>
    } else if (aggregations.length === 0) {
      content = <div>Nothing to show</div>
    } else {
      content = (
        <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {aggregations.map(agg => {
                return (
                  <TableRow key={agg.id}>
                    <TableCell>{agg.date}</TableCell>
                    <TableCell>
                      <Typography className={classNames([classes.textNumber])}>
                        {agg.balance.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
      )
    }

    return (
      <div className="content-wrapper">
        <Paper elevation={1} className="paper-wrapper">
          <Typography variant="h6" className={classNames([classes.header])}>
            Dashboard
          </Typography>

          {content}
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
  },
  textNumber: {
    textAlign: 'right'
  },
  amountPositive: {
    color: 'green'
  },
  amountNegative: {
    color: 'red'
  },
  textMuted: {
    color: 'grey',
    fontStyle: 'italic'
  }
}

export default withStyles(styles)(Dashboard)
