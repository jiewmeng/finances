const functions = require('firebase-functions')
const { Storage } = require('@google-cloud/storage')
const admin = require('firebase-admin')
const path = require('path')
const os = require('os')
const fs = require('fs')
const util = require('util')
const { DateTime } = require('luxon')

/**
 * When a statement is uploaded,
 *
 * - read PDF from Cloud Storage
 * - Create a statement
 * - And transaction records
 */
module.exports = functions.storage.object().onFinalize((obj, context) => {
  const storage = new Storage({
    projectId: process.env.GCP_PROJECT
  })
  const bucketName = obj.bucket
  const contentType = obj.contentType
  const filePath = obj.name
  const parts = filePath.split('/')

  if (contentType !== 'application/pdf') {
    console.warn('File is not a PDF ... skipping')
    return
  }

  if (parts.length !== 2) {
    console.warn('Path length is not 2 ... skipping')
    return
  }
  const regexFile = /^(dbs|dbscredit|uob|uobcredit|sc|stashaway|poems)-\d{4}-\d{2}\.pdf$/
  if (!regexFile.test(parts[1])) {
    console.warn(`Part 2 does not match statement filename: Got ${parts[1]} ... skipping`)
    return
  }

  // download pdf
  const bucket = storage.bucket(obj.bucket)
  const tempFilePath = path.join(os.tmpdir(), path.basename(filePath))
  return bucket.file(filePath)
    .download({ destination: tempFilePath })
    .then(() => {
      const buf = fs.readFileSync(tempFilePath)

      const [, type] = regexFile.exec(parts[1])
      switch (type) {
        case 'uob':
          return require('./uob-bank')(buf)
        default:
          throw new Error(`unknown type ${type}, ${parts[1]}`)
      }
    })
    .then(data => {
      console.log(util.inspect(data))
      const db = admin.firestore()
      const statementId = data.statementId
      const statementsRef = db.collection(`users/${parts[0]}/statements`)
      const transactionsRef = db.collection(`users/${parts[0]}/transactions`)

      const existingStatementQuery = statementsRef.doc(data.statementId)
      const existingTransactionsQuery = transactionsRef
        .where('statement', '==', data.statementId)

      const transaction = db.runTransaction(t => {
        // Delete existing statement and transactions objects
        console.log('Deleting old data ...')
        return t.get(existingTransactionsQuery)
          .then(txns => {
            t.delete(existingStatementQuery)
            txns.forEach(txn => t.delete(txn.ref))
          })
          .then(() => {
            // Add back new statement and transactions
            const statementRef = statementsRef.doc(statementId)
            const accounts = {}
            Object.keys(data.accounts).forEach(a => {
              accounts[data.accounts[a].accountNumber] = {
                name: a,
                accountNumber: data.accounts[a].accountNumber,
                startingBalance: data.accounts[a].startingBalance,
                endingBalance: data.accounts[a].endingBalance,
                interest: data.accounts[a].interest
              }
            })
            const statementRecord = {
              isParsed: false,
              uploadedOn: DateTime.local().setZone('Asia/Singapore').toISO(),
              startDate: data.startDate,
              endDate: data.endDate,
              accounts
            }
            t.set(statementRef, statementRecord)

            console.log('Adding new transactions ...')
            Object.keys(data.accounts).forEach(a => {
              data.accounts[a].transactions.forEach(txnData => {
                console.log(txnData)
                const txnRef = transactionsRef.doc(`${txnData.statement}::${txnData.accountNumber}::${txnData.id}`)
                t.create(txnRef, txnData)
              })
            })

            console.log('Done!')
          })
      })
    })
})
