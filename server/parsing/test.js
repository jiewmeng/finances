const Parser = require('./parser')

// Parser.parse('/data/JM/Transactions/dbs-bank/dbs-2017-12.pdf')
Parser.parse('/data/JM/Transactions/sc-credit/sc-2020-01.pdf')
  .then((statement) => {
    console.log(JSON.stringify(statement, undefined, 2))
  })
  .catch(err => console.log(err))
