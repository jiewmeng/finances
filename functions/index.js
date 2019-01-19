
const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp(functions.config().firebase)

// Cloud Storage trigger on statement upload: parse and write Statement & Transaction records
exports.onStatementUploadParse = require('./storageOnStatementUploadParse')

// Firestore trigger on statement write: aggregate transactions by day
exports.onStatementSaved = require('./onStatementWrite')
