const util = require('util')
const fs = require('fs')
const path = require('path')
const Parser = require('./parser')
const AWS = require('aws-sdk')
const { DateTime } = require('luxon')

const s3 = new AWS.S3()
const s3get = util.promisify(s3.getObject).bind(s3)
const exists = util.promisify(fs.exists).bind(fs)
const mkdir = util.promisify(fs.mkdir).bind(fs)
const writeFile = util.promisify(fs.writeFile).bind(fs)

const dynamodb = new AWS.DynamoDB()
const dynamodbBatchWrite = util.promisify(dynamodb.batchWriteItem).bind(dynamodb)
const dynamodbQuery = util.promisify(dynamodb.query).bind(dynamodb)

const regexS3Key = /^[\w\d-]+\/(dbscredit|dbs|uobcredit|uob|poems)-(\d{4})-(\d{2}).pdf$/
exports.handler = async (event) => {
  const s3key = event.Records[0].s3.object.key

  if (!s3key.match(regexS3Key)) {
    throw new Error(`[ERROR] Invalid s3 key ${s3key}`)
  }

  const [uid] = s3key.split('/')

  const data = await s3get({
    Bucket: 'jiewmeng-finances',
    Key: s3key
  })

  console.log('Downloaded S3 file')
  const now = DateTime.local().toUTC()
  const folder = `/tmp/${uid}`
  const filepath = `/tmp/${s3key}`

  const folderExists = await exists(folder)
  if (!folderExists) {
    await mkdir(folder)
  }

  await writeFile(filepath, data.Body)
  console.log('Parsing file')
  const statement = await Parser.parse(filepath)
  console.log(statement)

  // Check if statement already exists
  const checkResult = await dynamodbQuery({
    TableName: 'finances-statements',
    KeyConditionExpression: '#user = :u and statementId = :sid',
    ExpressionAttributeValues: {
      ':u': { S: uid },
      ':sid': { S: statement.statementId }
    },
    ExpressionAttributeNames: {
      '#user': 'user'
    },
    Select: 'COUNT',
    Limit: 1,
    ReturnConsumedCapacity: 'TOTAL'
  })

  if (checkResult.Count > 0) {
    console.log(`[STMT_EXISTS] Statement already exists (${statement.statementId}). Doing nothing.`)
    return
  }

  // write statement record
  const statementItem = {
    'finances-statements': [
      {
        PutRequest: {
          Item: {
            user: { S: uid },
            statementId: { S: statement.statementId },
            startDate: { S: statement.startDate },
            endDate: { S: statement.endDate },
            accounts: {
              L: Object.keys(statement.accounts).map(accountId => {
                return {
                  M: {
                    name: { S: accountId },
                    startingBalance: { N: statement.accounts[accountId].startingBalance.toFixed(2) },
                    endingBalance: { N: statement.accounts[accountId].endingBalance.toFixed(2) }
                  }
                }
              })
            }
          }
        }
      }
    ]
  }

  // write transactions records
  const transactionItems = {
    'finances-transactions': [].concat(...Object.keys(statement.accounts).map(accountId => {
      return statement.accounts[accountId].transactions.map(txn => {
        return {
          PutRequest: {
            Item: {
              user: { S: uid },
              date: { S: txn.date },
              description: { S: txn.description },
              balance: { N: txn.balance.toFixed(2) },
              category: { S: txn.category },
              amount: { N: txn.amount.toFixed(2) },
              txnid: { S: txn.id }
            }
          }
        }
      })
    }))
  }

  const dataToWrite = {
    RequestItems: {
      ...statementItem,
      ...transactionItems
    },
    ReturnConsumedCapacity: 'TOTAL'
  }

  console.log('Data to write', JSON.stringify(dataToWrite, undefined, 2))
  const writeResult = await dynamodbBatchWrite(dataToWrite)
  console.log(writeResult)
}
