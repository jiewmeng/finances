const AWS = require('aws-sdk')
const util = require('util')
const UtilService = require('../UtilService')

exports.handler = async (event) => {
  const dynamodb = new AWS.DynamoDB()
  const dynamodbQuery = util.promisify(dynamodb.query).bind(dynamodb)

  try {
    const statementsResult = await dynamodbQuery({
      TableName: 'finances-statements',
      AttributesToGet: [
        'statementId',
        'status'
      ],
      Select: 'SPECIFIC_ATTRIBUTES',
      Limit: 200,
      ConsistentRead: false,
      KeyConditions: {
        user: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [{
            S: 'jiewmeng'
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
