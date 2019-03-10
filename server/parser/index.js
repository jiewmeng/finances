const path = require('path')
const fs = require('fs')
const util = require('util')

const UobParser = require('./uob-bank')

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

    console.log(type, year, month)

    let output
    switch (type) {
      // case 'dbs':
      //   output = require('./dbs')(data, year, month, monthNumber)
      //   break
      // case 'dbscredit':
      //   output = require('./dbscredit')(data, year, month, monthNumber)
      //   break
      case 'uob':
        output = await UobParser(buf)
        break
      // case 'uobcredit':
      //   output = require('./uobcredit')(data, year, month, monthNumber)
      //   break
      // case 'poems':
      //   output = require('./poems')(data, year, month, monthNumber)
      //   break
      default:
        console.log(`Invalid type ${type}`)
    }

    console.log(JSON.stringify(output, undefined, 2))
  }
}
