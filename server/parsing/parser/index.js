const path = require('path')
const fs = require('fs')
const util = require('util')

const UobParser = require('./uob-bank')
const DbsParser = require('./dbs-bank')
const DbsCreditParser = require('./dbs-credit')
const UobCreditParser = require('./uob-credit')

module.exports = class Parser {
  /**
   * Given a filepath, reads it and passes file buffer to actual specialized parser to process
   * @param {string} filepath local pathname to file (eg. /tmp/something.pdf)
   * @return {object}
   */
  static async parse(filepath) {
    const readFile = util.promisify(fs.readFile).bind(fs)
    const buf = await readFile(filepath)

    const filename = path.basename(filepath)
    const regexFilename = /^(dbscredit|dbs|uobcredit|uob|poems)-(\d{4})-(\d{2}).pdf$/
    const matchFilename = regexFilename.exec(filename)
    if (!matchFilename) {
      return console.error('Invalid filename format', filename)
    }
    let [, type, year, month] = matchFilename
    year = parseInt(year, 10)
    month = parseInt(month, 10)

    let output
    switch (type) {
      case 'dbs':
        output = await DbsParser(buf)
        break
      case 'dbscredit':
        output = await DbsCreditParser(buf)
        break
      case 'uob':
        output = await UobParser(buf)
        break
      case 'uobcredit':
        output = await UobCreditParser(buf)
        break
      // case 'poems':
      //   output = require('./poems')(buf)
      //   break
      default:
        throw new Error(`[INVALID_STMT] Invalid type ${type}`)
    }

    return output
  }
}
