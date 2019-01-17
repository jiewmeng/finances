const path = require('path')
const os = require('os')
const fs = require('fs')

const buf = fs.readFileSync('/data/JM/Transactions/uob-bank/uob-2017-05.pdf')
require('./uob-bank')(buf)
  .then(data => {
    console.log(data)
  })
