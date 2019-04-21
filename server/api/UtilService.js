const AppError = require('./AppError')

module.exports = class UtilService {
  static jsonResponse(event, data, statusCode = 200) {
    const corsOrigins = process.env.CORS_ORIGINS || ''
    const corsUrls = corsOrigins.split(',').map(h => h.trim())
    console.log('event.headers', event.headers)
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

    console.log(`CORS_DENY: ${process.env.CORS_ORIGINS}`)
    console.log(`CORS_DENY: ${requestOrigin}`)
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
}
