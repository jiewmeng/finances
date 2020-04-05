const Parser = require('./parser')

Parser.parse('/data/JM/Transactions/stashaway/stashaway-2019-05.pdf')
// Parser.parse('/data/JM/Transactions/uob-bank/uob-2020-01.pdf')
  .then((statement) => {
    console.log(JSON.stringify(statement, undefined, 2))
  })
  .catch(err => console.log(err))
