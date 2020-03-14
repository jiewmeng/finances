const AppError = require('./AppError')
const { DateTime } = require('luxon')

module.exports = class UtilService {
  static jsonResponse(event, data, statusCode = 200) {
    const corsOrigins = process.env.CORS_ORIGINS || ''
    const corsUrls = corsOrigins.split(',').map(h => h.trim())
    const requestOrigin = event.headers ? event.headers.origin : ''

    if (!requestOrigin || corsOrigins === '*' || corsUrls.includes(requestOrigin)) {
      const headers = requestOrigin ? {
        "Access-Control-Allow-Headers": 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
        'Access-Control-Allow-Origin': requestOrigin,
        'Access-Control-Allow-Methods': 'POST,PUT,DELETE,OPTIONS'
      } : undefined

      return {
        statusCode,
        body: JSON.stringify(data),
        headers
      }
    }

    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Deny by CORS' })
    }
  }

  static handleError(event, err) {
    if (err instanceof AppError) {
      return UtilService.jsonResponse(event, {
        message: err.message,
        error: err.message, // for backward compatibility with droplet
        details: err.details
      }, err.statusCode)
    }
    console.log(err.stack)
    return UtilService.jsonResponse(event, {
      message: err.message
    }, 500)
  }

  static getDynamoValue(item) {
    let val
    Object.keys(item).forEach(t => {
      switch (t) {
        case 'N':
          val = parseFloat(item[t])
          break

        case 'L':
          val = item[t].map(item => UtilService.getDynamoValue(item))
          break

        case 'M':
          val = UtilService.transformDynamoItem(item[t])
          break

        case 'S':
        default:
          val = item[t]
      }
    })
    return val
  }

  static transformDynamoItem(item) {
    const obj = {}
    Object.keys(item).forEach(k => {
      obj[k] = UtilService.getDynamoValue(item[k])
    })
    return obj
  }

  static transformDynamoQueryResult(result) {
    const data = result.Items.map(item => UtilService.transformDynamoItem(item))

    data.forEach(item => {
      if (item.uploadedOn) {
        item.uploadedOn = DateTime.fromFormat(String(item.uploadedOn), 'yyyyMMddHHmmss', { zone: 'UTC' }).toISO()
      }
    })

    return {
      data,
      dynamodb: {
        count: result.Count,
        scannedCount: result.ScannedCount,
        consumedCapacity: result.ConsumedCapacity.CapacityUnits
      }
    }
  }
}
