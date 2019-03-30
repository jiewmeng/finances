const util = require('util')
const fs = require('fs')
const path = require('path')
const Parser = require('./parser')
const AWS = require('aws-sdk')

exports.handler = async () => {
  const s3 = new AWS.S3()
  const s3get = util.promisify(s3.getObject).bind(s3)
  const data = await s3get({
    Bucket: 'jiewmeng-finances',
    Key: 'uob-2016-12.pdf'
  })

  console.log('Downloaded S3 file')
  const writeFile = util.promisify(fs.writeFile).bind(fs)
  await writeFile('/tmp/uob-2016-12.pdf', data.Body)

  console.log('Parsing file')
  await Parser.parse('/tmp/uob-2016-12.pdf')
}
