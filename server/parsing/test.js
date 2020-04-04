const Parser = require('./parser')

Parser.parse('/data/JM/Transactions/stashaway/stashaway-2018-07.pdf')
// Parser.parse('/data/JM/Transactions/uob-credit/uobcredit-2020-01.pdf')
  .then((statement) => {
    console.log(JSON.stringify(statement, undefined, 2))
  })
  .catch(err => console.log(err))
