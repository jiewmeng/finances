const {promisify} = require('util')
const fs = require('fs')
const path = require('path')
const {MongoClient} = require('mongodb')
const Parser = require('./parser')
// const data = require('./out.json')
const secret = require('./secret')

const readdir = promisify(fs.readdir).bind(fs)

async function main() {
  const ROOT_DIR = `/data/JM/Transactions`
  // const STATEMENT_FOLDERS = ['stashaway']
  const STATEMENT_FOLDERS = ['dbs-bank', 'dbs-credit', 'uob-bank', 'uob-credit', 'sc-credit', 'stashaway']

  // const url = `mongodb://localhost:27017`
  const url = secret.dbUrl
  const client = new MongoClient(url)
  const mongoConnect = promisify(client.connect).bind(client)
  await mongoConnect()
  const db = client.db('finances')

  try {
    const data = await Promise.all(STATEMENT_FOLDERS.map(async (folder) => {
      const files = await readdir(path.resolve(ROOT_DIR, folder))

      for (var i = 0; i < files.length; i++) {
        const file = files[i]

        // Parse
        const filepath = path.resolve(ROOT_DIR, folder, file)
        const data = await Parser.parse(filepath)

        // Sanity check
        const mismatchBalance = (folder !== 'stashaway')
          ? data.accounts.find(account => Math.abs(account.endingBalance - account.transactions[account.transactions.length - 1].balance) > 1)
          : false
        if (mismatchBalance) {
          console.log(JSON.stringify(data, undefined, 2))
          // throw new Error(`Balance mismatch in ${filepath}, ${mismatchBalance.endingBalance} ${mismatchBalance.transactions[mismatchBalance.transactions.length - 1].balance}`)
        }

        // Check if DB already contains statement
        const existing = await db.collection('statements').find({
          yearMonth: data.yearMonth,
          assetType: data.assetType,
          type: data.type,
        }).limit(1).toArray()
        if (existing.length === 0) {
          // Write transactions to DB
          const transactions = data.accounts.map(account => {
            return account.transactions.map(txn => {
              return {
                ...txn,
                stmtYearMonth: data.yearMonth,
                stmtAssetType: data.assetType,
                stmtType: data.type,
                account: account.name
              }
            })
          }).flat()

          if (transactions.length > 0) await db.collection('transactions').insertMany(transactions)

          // Write statement to DB
          await db.collection('statements').insertOne({
            yearMonth: data.yearMonth,
            assetType: data.assetType,
            type: data.type,
          })

          // Write accounts to DB
          await db.collection('accounts').insertMany(data.accounts.map(acc => ({
            stmtYearMonth: data.yearMonth,
            stmtAssetType: data.assetType,
            stmtType: data.type,
            name: acc.name,
            startingBalance: acc.startingBalance,
            endingBalance: acc.endingBalance,
            cashflow: data.type === 'stashaway' ? (acc.cashflow || 0) : acc.endingBalance - acc.startingBalance,
          })))

          console.log(`Wrote ${data.yearMonth} ${data.type}`)
        }
      }
    }))

    client.close()
  } catch (err) {
    console.error(err)
  }
}
main()
