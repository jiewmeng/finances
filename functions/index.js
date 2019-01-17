
const functions = require('firebase-functions')
const { Storage } = require('@google-cloud/storage')
const admin = require('firebase-admin')
const path = require('path')
const os = require('os')
const fs = require('fs')
const { DateTime } = require('luxon')

admin.initializeApp(functions.config().firebase)

const pdf = require('pdf-parse')

exports.onStatementUploadParse = require('./storageOnStatementUploadParse')

// // Recompute aggregations
// function onStatementChange(userId, statementId) {
//   const db = admin.firestore()

//   // Get transactions for the statement ...
//   return db.runTransaction(t => {
//     const transactionsQuery = db.collection(`users/${userId}/transactions`)
//       .where('statement', '==', statementId)
//     return t.get(transactionsQuery)
//       .then(transactions => {
//         const aggregations = []

//         console.log()
//       })
//   })

//   // Compute aggregations, grouped by day

//   // Delete old aggregations

//   // Add new aggregations
// }

// exports.onStatementSaved = functions.firestore.document('users/{userId}/statements/{statementId}').onCreate((snapshot, context) => {
//   const { userId, statementId } = context.params
//   return onStatementChange(userId, statementId)
// })
