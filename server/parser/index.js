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

    const result = await UobParser(buf)
    console.log(JSON.stringify(result, undefined, 2))
  }
}
