const functions = require('firebase-functions')
const admin = require('firebase-admin')

function onStatementWrite(userId, statementId) {
  const db = admin.firestore()

  // Get transactions for the statement ...
  return db.runTransaction(t => {
    const transactionsQuery = db.collection(`users/${userId}/transactions`)
      .where('statement', '==', statementId)
    const statementQuery = db.doc(`users/${userId}/statements/${statementId}`)
    const oldAggregations = db.collection(`users/${userId}/aggregations`)
       .where('statement', '==', statementId)

    return Promise.all([
      t.get(transactionsQuery),
      t.get(statementQuery),
      t.get(oldAggregations)
    ])
      .then(([transactionsSnap, statementSnap, oldAggregationsSnap]) => {
        const transactions = []

        transactionsSnap.forEach(snap => {
          const txn = snap.data()
          transactions.push(txn)
        })

        console.log('transactions', transactions)

        const stmt = statementSnap.data()
        console.log(stmt)

        const aggregations = transactions.reduce((aggregatedValues, txn) => {
          if (!(txn.date in aggregatedValues)) aggregatedValues[txn.date] = 0
          aggregatedValues[txn.date] += txn.amount
          aggregatedValues[txn.date] = parseFloat(aggregatedValues[txn.date].toFixed(2))
          return aggregatedValues
        }, {})

        const statementStartingBalance = Object.keys(stmt.accounts).reduce((bal, accId) => {
          const acc = stmt.accounts[accId]
          return bal + acc.startingBalance
        }, 0)

        // Compute day aggregations
        const aggBalances = {}
        let currBalance = statementStartingBalance
        Object.keys(aggregations).sort().forEach(date => {
          currBalance += aggregations[date]
          currBalance = parseFloat(currBalance.toFixed(2))
          aggBalances[date] = currBalance
        })

        // Delete old aggregations
        oldAggregationsSnap.forEach(oldAggregation => {
          t.delete(oldAggregation)
        })

        // Add new aggregations
        Object.keys(aggBalances).forEach(date => {
          const data = {
            statementId,
            date,
            amount: aggregations[date],
            balance: aggBalances[date]
          }
          const ref = db.doc(`users/${userId}/aggregations/${date}::${statementId}`)
          t.set(ref, data)
        })
      })
  })
}


module.exports = functions.firestore.document('users/{userId}/statements/{statementId}').onWrite((change, context) => {
  const { userId, statementId } = context.params
  return onStatementWrite(userId, statementId)
})
