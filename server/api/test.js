obj = {
  "Items": [
      {
          "statementId": {
              "S": "2016-12-uob"
          },
          "status": {
              "S": "UPLOADED"
          },
          "uploadedOn": {
              "N": "20190518072744"
          }
      },
      {
          "statementId": {
              "S": "2016-08-uob"
          },
          "status": {
              "S": "UPLOADED"
          },
          "uploadedOn": {
              "N": "20190518134748"
          }
      },
      {
          "subType": {
              "S": "UOB"
          },
          "accounts": {
              "L": [
                  {
                      "M": {
                          "name": {
                              "S": "One Account 349-311-891-7"
                          },
                          "endingBalance": {
                              "N": "7571.46"
                          },
                          "startingBalance": {
                              "N": "4698.52"
                          }
                      }
                  }
              ]
          },
          "statementId": {
              "S": "2016-06-uob"
          },
          "status": {
              "S": "DONE"
          },
          "type": {
              "S": "Bank"
          },
          "uploadedOn": {
              "N": "20190518141916"
          }
      },
      {
          "statementId": {
              "S": "2016-05-uob"
          },
          "status": {
              "S": "UPLOADED"
          },
          "uploadedOn": {
              "N": "20190518140428"
          }
      }
  ],
  "Count": 4,
  "ScannedCount": 4,
  "ConsumedCapacity": {
      "TableName": "finances-statements",
      "CapacityUnits": 0.5
  }
}

const UtilService = require('./UtilService')

console.log(JSON.stringify(UtilService.transformDynamoQueryResult(obj)))
