const UtilService = require('./UtilService')
const AppError = require('./AppError')
const admin = require('firebase-admin')
const serviceAcc = require('./keys/firebase-dev.json')

const regexAuthorization = /^Bearer (.*)$/

admin.initializeApp({
  credential: admin.credential.cert(serviceAcc)
})

function createPolicy(principalId, effect, resources, context = {}) {
  const authResponse = {
    principalId
  }

  const policyDoc = {
    Version: '2012-10-17',
    Statement: []
  }

  policyDoc.Statement.push({
    Action: 'execute-api:Invoke',
    Effect: effect,
    Resource: resources
  })

  authResponse.policyDocument = policyDoc
  authResponse.context = context

  return authResponse
}


exports.handler = async (event) => {
  try {
    const tokenStr = event.authorizationToken
    const tokenMatches = regexAuthorization.exec(tokenStr)

    if (!tokenMatches) {
      throw new AppError('Invalid Authorization header. Should be in format "Bearer JWT_TOKEN_STRING"', 400)
    }

    const tokenData = await admin.auth().verifyIdToken(tokenMatches[1], true)
    if (tokenData.uid === 'FrMd6Wqch8XJm32HihF14tl6Wui2' && tokenData.email === 'jiewmeng@gmail.com') {
      return createPolicy(tokenData.uid, 'Allow', [`arn:aws:execute-api:*:*:${process.env.API_ID}/*`], {
        uid: tokenData.uid,
        email: tokenData.email,
        name: tokenData.name
      })
    }
    throw new Error('Unauthorized')
  } catch (err) {
    console.log(err.message)
    throw new Error('Unauthorized')
  }
}
