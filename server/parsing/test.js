const Parser = require('./parser')

Parser.parse('/data/JM/Transactions/dbs-bank/dbs-2019-01.pdf')
// Parser.parse('/data/JM/Transactions/uob-credit/uobcredit-2020-01.pdf')
  .then((statement) => {
    console.log(JSON.stringify(statement, undefined, 2))
  })
  .catch(err => console.log(err))
