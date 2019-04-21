const AppError = require('../AppError')

const regexFilename = /^(uob|dbs)-(\d{4}-\d{2}).pdf$/

module.exports = class StatementService {
  static validateUploadStatement(body) {
    const errors = {}

    if (body.files.length !== 1) {
      errors.statementPdf = 'Should have exactly 1 file uploaded'
    } else if (body.files[0].contentType !== 'application/pdf') {
      errors.statementPdf = `File uploaded should be a PDF. Got ${body.files[0].contentType}`
    } else if (!regexFilename.test(body.files[0].filename)) {
      errors.statementPdf = `Filename should be in format "uob|dbs-YYYY-MM.pdf". Got ${body.files[0].filename}`
    }

    if (Object.keys(errors).length > 0) {
      throw new AppError('Invalid request', 400, undefined, errors)
    }
  }
}
