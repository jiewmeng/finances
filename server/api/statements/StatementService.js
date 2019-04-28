const AppError = require('../AppError')

const regexFilename = /^(uob|dbs)-(\d{4}-\d{2}).pdf$/

module.exports = class StatementService {
  static validateUploadStatement(body) {
    const errors = {}

    body.files.forEach((file, i) => {
      const err = {}
      if (file.contentType !== 'application/pdf') {
        err.statementPdf = `File uploaded should be a PDF. Got ${file.contentType}`
      } else if (!regexFilename.test(file.filename)) {
        err.statementPdf = `Filename should be in format "uob|dbs-YYYY-MM.pdf". Got ${file.filename}`
      }

      if (Object.keys(err).length > 0) {
        errors[`file-${i}`] = err
      }
    })


    if (Object.keys(errors).length > 0) {
      throw new AppError('Invalid request', 400, undefined, errors)
    }
  }
}
