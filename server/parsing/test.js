const Parser = require('./parser')

// Parser.parse('/data/JM/Transactions/dbs-bank/dbs-2017-12.pdf')
Parser.parse('/data/JM/Transactions/dbs-bank/dbs-2017-01.pdf')
  .then((statement) => {
    console.log(JSON.stringify(statement, undefined, 2))

    // const transactionsFlattened = [].concat(...Object.keys(statement.accounts).map(accountId => {
    //   return statement.accounts[accountId].transactions.map(txn => {
    //     return {
    //       date: txn.date,
    //       amount: txn.amount,
    //       balance: txn.balance
    //     }
    //   })
    // })).sort((a, b) => {
    //   if (a.date > b.date) return 1
    //   if (a.date < b.date) return -1
    //   return 0
    // })

    // const startingBalance = Object.keys(statement.accounts).reduce((sum, accountId) => {
    //   return statement.accounts[accountId].startingBalance += sum
    // }, 0)
    // let currBalance = startingBalance

    // const dayGroups = {}
    // transactionsFlattened.forEach(txn => {
    //   if (!(txn.date in dayGroups)) {
    //     dayGroups[txn.date] = {
    //       amount: 0,
    //       balance: 0
    //     }
    //   }

    //   dayGroups[txn.date].amount += txn.amount

    //   currBalance += txn.amount
    //   dayGroups[txn.date].balance = parseFloat(currBalance.toFixed(2))
    // })

    // console.log(dayGroups)
  })
  .catch(err => console.log(err))

// const listHandler = require('./api/statements/list').handler
// listHandler({})
//   .then(result => {
//     console.log(result)
//   })
//   .catch(err => console.error(err))
