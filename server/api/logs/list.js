const AWS = require('aws-sdk')
const util = require('util')
const UtilService = require('../UtilService')

exports.handler = async (event) => {
  const dynamodb = new AWS.DynamoDB()
  const dynamodbQuery = util.promisify(dynamodb.query).bind(dynamodb)
  const uid = event.requestContext.authorizer.uid

  try {
    const statementsResult = await dynamodbQuery({
      TableName: 'finances-logs',
      Select: 'ALL_ATTRIBUTES',
      Limit: 50,
      ConsistentRead: false,
      KeyConditions: {
        user: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [{
            S: uid
          }]
        }
      },
      ScanIndexForward: false,
      ReturnConsumedCapacity: 'TOTAL'
    })
    const data = UtilService.transformDynamoQueryResult(statementsResult)

    return UtilService.jsonResponse(event, data)
  } catch (err) {
    return UtilService.handleError(event, err)
  }
}
