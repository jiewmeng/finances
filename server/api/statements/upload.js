const util = require('util')
const path = require('path')
const AWS = require('aws-sdk')
const parser = require('lambda-multipart-parser')

const UtilService = require('../UtilService')
const StatementService = require('./StatementService')

exports.handler = async (event) => {
  const uid = event.requestContext.authorizer.uid

  const S3 = new AWS.S3()
  const s3PutObject = util.promisify(S3.putObject).bind(S3)

  const dynamodb = new AWS.DynamoDB()
  const dynamodbBatchWrite = util.promisify(dynamodb.batchWriteItem).bind(dynamodb)

  const body = await parser.parse(event)

  try {
    StatementService.validateUploadStatement(body)

    // Write file to S3
    const bucket = process.env.S3_BUCKET

    const results = await Promise.all(body.files.map(file => {
      return new Promise(async (resolve, reject) => {
        const key = `statements/${uid}/${file.filename}`
        console.log(`Processing ${key} ...`)
        try {
          const resp = await s3PutObject({
            Body: file.content,
            Bucket: bucket,
            Key: key
          })
          let statementId = path.basename(file.filename, '.pdf')
          const statementIdMatches = /^(.*)-(\d{4}-\d{2})$/.exec(statementId)
          statementId = `${statementIdMatches[2]}-${statementIdMatches[1]}`

          const result = await dynamodbBatchWrite({
            RequestItems: {
              'finances-statements': [
                {
                  PutRequest: {
                    Item: {
                      user: { S: uid },
                      statementId: { S: statementId },
                      status: { S: 'UPLOADED' }
                    }
                  }
                }
              ],
              'finances-logs': [
                {
                  PutRequest: {
                    Item: {
                      timestamp: { N: String(Date.now()) },
                      user: { S: uid },
                      action: { S: `Uploaded statement ${path.basename(file.filename, '.pdf')}` }
                    }
                  }
                }
              ]
            },
            ReturnConsumedCapacity: 'TOTAL'
          })
          console.log(`${key} DONE!`)
          console.log(result)
          resolve(`${key} DONE!`)
        } catch (err) {
          console.error(`[ERROR] Failed ${key}: ${err.message}`)
          resolve(`${key} ERROR: ${err.message}`)
        }
      })
    }))

    return UtilService.jsonResponse(event, {
      message: 'done',
      details: results
    })
  } catch (err) {
    return UtilService.handleError(event, err)
  }
}
