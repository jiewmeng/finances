import React from 'react'
import classNames from 'classnames'
import { withStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'

import * as firebase from 'firebase'


class Transactions extends React.Component {
  constructor(params) {
    super(params)
    this.state = {
      transactions: [],
      isGettingTransactions: false,
      error: undefined
    }
  }

  componentDidMount() {
    // Get transactions
    this.setState({ isGettingTransactions: true, error: undefined })

    const db = firebase.firestore()
    const currUser = firebase.auth().currentUser
    console.log('getting', `users/${currUser.uid}/transactions`)
    db.collection(`users/${currUser.uid}/transactions`)
      .orderBy('date', 'desc')
      .limit(100)
      .get()
      .then(querySnapshot => {
        const transactions = []
        querySnapshot.forEach(doc => transactions.push(doc.data()))
        this.setState({
          isGettingTransactions: false,
          transactions
        })
      })
      .catch(err => {
        console.error(err)
        this.setState({
          error: err.message,
          isGettingTransactions: false
        })
      })
  }

  render() {
    const { classes } = this.props
    const { isGettingTransactions, transactions, error } = this.state

    let content

    if (isGettingTransactions) {
      content = <div>Loading ...</div>
    } else if (!isGettingTransactions && transactions.length === 0) {
      content = <div>No transactions to show</div>
    } else if (!isGettingTransactions && error) {
      content = <div>{error}</div>
    } else {
      content = (
        <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Account</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map(transaction => {
                console.log(transaction.description, transaction.deposits, transaction.withdrawals)
                return (
                  <TableRow>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>
                      {
                        transaction.description.split('\n')
                          .map((item, key) => {
                            return <React.Fragment key={key}>{item} <br /></React.Fragment>
                          })
                      }
                    </TableCell>
                    <TableCell>{transaction.deposits - transaction.withdrawals}</TableCell>
                    <TableCell>{transaction.balance}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.accountName} {transaction.accountNumber}</TableCell>
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
            Transactions
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
  }
}

export default withStyles(styles)(Transactions)
