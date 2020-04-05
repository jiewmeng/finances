const { promisify } = require('util')
const { MongoClient, ObjectID } = require('mongodb')
const secret = require('./secret')

async function main() {
  // const url = `mongodb://localhost:27017`
  const url = secret.dbUrl
  const client = new MongoClient(url)
  const mongoConnect = promisify(client.connect).bind(client)

  try {
    await mongoConnect()
    const db = client.db('finances')

    const balances = {}
    const result = await db.collection('accounts')
      .find({ stmtType: 'stashaway' })
      .sort({ stmtYearMonth: 1 })
      .map(account => {
        if (!(account.name in balances)) balances[account.name] = 0
        balances[account.name] += (account.cashflow || 0)

        return {
          _id: account._id,
          balance: balances[account.name]
        }
      })
      .toArray()

    await db.collection('accounts').bulkWrite(result.map(account => {
      return {
        updateOne: {
          filter: { _id: new ObjectID(account._id) },
          update: { $set: { balance: account.balance } }
        }
      }
    }))
  } catch (err) {
    console.error(err)
  }
}

main()
