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
const dynamodbPutItem = util.promisify(dynamodb.putItem).bind(dynamodb)
const dynamodbUpdateItem = util.promisify(dynamodb.updateItem).bind(dynamodb)
const dynamodbQuery = util.promisify(dynamodb.query).bind(dynamodb)

// const regexS3Key = /^statements\/[\w\d-]+\/(dbscredit|dbs|uobcredit|uob|poems)-(\d{4})-(\d{2}).pdf$/
const regexS3Key = /^statements\/[\w\d-]+\/(dbs|uob)-(\d{4})-(\d{2}).pdf$/
exports.handler = async (event) => {
  const s3key = event.Records[0].s3.object.key
  const filenameMatches = s3key.match(regexS3Key)

  if (!filenameMatches) {
    throw new Error(`[ERROR] Invalid s3 key ${s3key}`)
  }

  const [, uid, filename] = s3key.split('/')

  const data = await s3get({
    Bucket: 'jiewmeng-finances',
    Key: s3key
  })

  const now = DateTime.local().toUTC()
  const folder = `/tmp/${uid}`
  const filepath = `/tmp/${uid}/${filename}`

  const folderExists = await exists(folder)
  if (!folderExists) {
    await mkdir(folder)
  }

  await writeFile(filepath, data.Body)
  const statement = await Parser.parse(filepath)
  console.log(JSON.stringify(statement))

  // Compute day aggregates
  const transactionsFlattened = [].concat(...Object.keys(statement.accounts).map(accountId => {
    return statement.accounts[accountId].transactions.map(txn => {
      return {
        date: txn.date,
        amount: txn.amount,
        balance: txn.balance
      }
    })
  })).sort((a, b) => {
    if (a.date > b.date) return 1
    if (a.date < b.date) return -1
    return 0
  })

  const startingBalance = Object.keys(statement.accounts).reduce((sum, accountId) => {
    return statement.accounts[accountId].startingBalance += sum
  }, 0)
  let currBalance = startingBalance

  const dayGroups = {}
  transactionsFlattened.forEach(txn => {
    if (!(txn.date in dayGroups)) {
      dayGroups[txn.date] = {
        amount: 0,
        balance: 0
      }
    }

    dayGroups[txn.date].amount += txn.amount

    currBalance += txn.amount
    dayGroups[txn.date].balance = parseFloat(currBalance.toFixed(2))
  })

  // Check that statement filename and statement dates match
  const [,, filenameYear, filenameMonth] = filenameMatches
  const filenameYearMonth = `${filenameYear}${filenameMonth}`

  if (filenameYearMonth !== statement.statementYearMonth) {
    const msg = `Filename and statement year month mismatch. S3 Key: ${s3key}. Filename: ${filenameYearMonth}. Statement: ${statement.statementYearMonth}`

    await dynamodbPutItem({
      Item: {
        timestamp: { N: String(Date.now()) },
        user: { S: uid },
        action: { S: `[ERROR] ${msg}` }
      },
      TableName: 'finances-logs',
      ReturnConsumedCapacity: "TOTAL",
    })

    await dynamodbUpdateItem({
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': { S: 'ERROR_YEAR_MONTH_MISMATCH' }
      },
      Key: {
        'user': { S: uid },
        'statementId': { S: statement.statementId }
      },
      UpdateExpression: 'SET #status = :status',
      TableName: 'finances-statements'
    })

    throw new Error(`[ERROR] ${msg}`)
  }

  // Check if statement already exists (with DONE status)
  const checkResult = await dynamodbQuery({
    TableName: 'finances-statements',
    KeyConditionExpression: '#user = :u and statementId = :sid',
    ExpressionAttributeValues: {
      ':u': { S: uid },
      ':sid': { S: statement.statementId },
    },
    ExpressionAttributeNames: {
      '#user': 'user',
    },
    Limit: 1,
    ReturnConsumedCapacity: 'TOTAL'
  })

  if (checkResult.Count > 0 && checkResult.Items[0].status === 'DONE') {
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
            status: { S: 'DONE' },
            statementId: { S: statement.statementId },
            startDate: { S: statement.startDate },
            type: { S: statement.type },
            subType: { S: statement.subType },
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

  const dayAggItems = {
    'finances-day-aggregations': Object.keys(dayGroups).map(date => {
      return {
        PutRequest: {
          Item: {
            user: { S: uid },
            dateAndStatement: { S: `${date}-${statement.statementId}` },
            amount: { N: dayGroups[date].amount.toFixed(2) },
            balance: { N: dayGroups[date].balance.toFixed(2) }
          }
        }
      }
    })
  }

  const logItems = {
    'finances-logs': [
      {
        PutRequest: {
          Item: {
            timestamp: { N: String(Date.now()) },
            user: { S: uid },
            action: { S: `[SUCCESS] Finished parsing ${statement.statementId}` }
          }
        }
      }
    ]
  }

  const dataToWrite = {
    RequestItems: {
      ...statementItem,
      ...transactionItems,
      ...dayAggItems,
      ...logItems
    },
    ReturnConsumedCapacity: 'TOTAL'
  }
  console.log(JSON.stringify(dataToWrite))

  const writeResult = await dynamodbBatchWrite(dataToWrite)
  console.log(writeResult)
}
