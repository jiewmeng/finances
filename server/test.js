const Parser = require('./parser')

// Parser.parse('/data/JM/Transactions/dbs-bank/dbs-2017-12.pdf')
Parser.parse('/data/JM/Transactions/uob-bank/uob-2017-07.pdf')
  .then((data) => console.log(JSON.stringify(data, undefined, 2)))
  .catch(err => console.log(err))
