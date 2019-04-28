const AWS = require('aws-sdk')
const util = require('util')
const UtilService = require('../UtilService')

exports.handler = async (event) => {
  const dynamodb = new AWS.DynamoDB()
  const dynamodbQuery = util.promisify(dynamodb.query).bind(dynamodb)
  const uid = event.requestContext.authorizer.uid

  try {
    const result = await dynamodbQuery({
      TableName: 'finances-transactions',
      Select: 'ALL_ATTRIBUTES',
      Limit: 50,
      ConsistentRead: false,
      KeyConditions: {
        user: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [{
            S: uid
          }]
        },
        txnid: {
          ComparisonOperator: 'BEGINS_WITH',
          AttributeValueList: [{
            S: 'cash-'
          }]
        }
      },
      ScanIndexForward: false,
      ReturnConsumedCapacity: 'TOTAL'
    })
    const data = UtilService.transformDynamoQueryResult(result)

    return UtilService.jsonResponse(event, data)
  } catch (err) {
    return UtilService.handleError(event, err)
  }
}
