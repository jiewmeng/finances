const util = require('util')
const path = require('path')
const AWS = require('aws-sdk')
const parser = require('lambda-multipart-parser')

const UtilService = require('../UtilService')
const StatementService = require('./StatementService')

exports.handler = async (event) => {
  const S3 = new AWS.S3()
  const s3PutObject = util.promisify(S3.putObject).bind(S3)

  const dynamodb = new AWS.DynamoDB()
  const dynamodbBatchWrite = util.promisify(dynamodb.batchWriteItem).bind(dynamodb)

  const body = await parser.parse(event)

  try {
    StatementService.validateUploadStatement(body)

    // Write file to S3
    const bucket = process.env.S3_BUCKET
    const key = `statements/jiewmeng/${body.files[0].filename}`
    const resp = await s3PutObject({
      Body: body.files[0].content,
      Bucket: bucket,
      Key: key
    })
    const statementId = body.files[0].filename

    await dynamodbBatchWrite({
      RequestItems: {
        'finances-statements': [
          {
            PutRequest: {
              Item: {
                user: { S: 'jiewmeng' },
                statementId: { S: path.basename(body.files[0].filename, '.pdf') },
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
                user: { S: 'jiewmeng' },
                action: { S: `Uploaded statement ${path.basename(body.files[0].filename, '.pdf')}` }
              }
            }
          }
        ]
      },
      ReturnConsumedCapacity: 'TOTAL'
    })

    return UtilService.jsonResponse(event, {
      message: `Uploaded file to s3://${bucket}/${key}`
    })
  } catch (err) {
    return UtilService.handleError(event, err)
  }
}
