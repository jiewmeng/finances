const pdf = require('pdf-parse')
const { DateTime } = require('luxon')

module.exports = function (buf) {
  const LEFT = 52.4
  const RIGHT = 530.3
  const TOP = 743.6
  const BOTTOM = 49.5
  const STOP_PARSE = 'Foreign Exchange, Gold, Silver'
  const ACCEPTABLE_DIFF = 0.05

  const regexAccountDetails = /^Account Transaction Details/
  const regexAccount = /^(.*)\s+(\d{3}-\d{3}-\d{3}-\d{1})/
  const regexEnd = /End of Transaction Details/
  const regexDate = /^\d{2} \w{3}$/
  const regexStatementDate = /^Account Overview as at (\d{2} \w{3} \d{4})$/
  const accounts = {}
  let statementDate
  let statementYearMonth
  let statementYear

  const renderPage = (data) => {
    const opts = {
      normalizeWhitespace: false,
      disableCombineTextItems: false
    }

    let isEnd = false // true when finished parsing statement
    let isParsing = false // true when inside a table
    let reachedTotals = false // true when reach totals line
    let account = ''
    let headers = [] // should have 5

    return data.getTextContent(opts)
      .then((textContent) => {
        // Filter out headers and footers of PDF
        const contentArea = textContent.items.filter((item, page) => {
          const x = item.transform[4]
          const y = item.transform[5]

          return (x > LEFT && x < RIGHT && y < TOP && y > BOTTOM)
        })

        // Variables for storing the "context" of a transaction
        let date = ''
        let transactionDesc = ''
        let withdrawals = 0
        let deposits = 0
        let balance = 0
        contentArea.forEach(line => {
          if (isEnd) return

          // Parse statement date in page 1
          if (data.pageIndex === 0 && regexStatementDate.test(line.str)) {
            const [, dateStr] = regexStatementDate.exec(line.str)
            statementDate = DateTime.fromFormat(dateStr, 'dd MMM yyyy')
            statementYear = statementDate.toFormat('yyyy')
            statementYearMonth = statementDate.toFormat('yyyyMM')
            return
          }
          if (data.pageIndex === 0) return

          // Start when "Account Transaction Details" is found
          if (regexAccountDetails.test(line.str)) {
            isParsing = true
            account = ''
            headers = []
            reachedTotals = false
            return
          }

          // Match account name
          if (!isEnd && isParsing && regexAccount.test(line.str)) {
            const [, accountName, accountNumber] = regexAccount.exec(line.str)
            account = `${accountName} ${accountNumber}`.replace(/\s+/ig, ' ')
            if (!(account in accounts)) {
              accounts[account] = {
                startingBalance: 0,
                endingBalance: 0,
                interest: 0,
                transactions: [],
                accountName,
                accountNumber
              }
            }
            return
          }

          // Header positions
          if (!isEnd && isParsing && account && headers.length < 5) {
            if (line.str === 'Date') {
              headers[0] = { name: 'date', left: line.transform[4] }
            } else if (line.str === 'Description') {
              headers[1] = { name: 'description', left: line.transform[4] }
            } else if (line.str === 'Withdrawals') {
              headers[2] = { name: 'withdrawals', left: line.transform[4], right: line.transform[4] + line.width }
            } else if (line.str === 'Deposits') {
              headers[3] = { name: 'deposits', left: line.transform[4], right: line.transform[4] + line.width }
            } else if (line.str === 'Balance') {
              headers[4] = { name: 'balance', left: line.transform[4], right: line.transform[4] + line.width }
            }
            return
          }

          // Transaction info
          if (!isEnd && isParsing && headers.length === 5 && account) {
            // Date col
            if (line.transform[4] === headers[0].left && regexDate.test(line.str)) {
              date = `${line.str} ${statementYear}`

              transactionDesc = ''
              withdrawals = 0
              deposits = 0
              balance = 0
              return
            }

            // Description col
            if (line.transform[4] === headers[1].left && line.transform[4] + line.width < headers[2].left) {
              if (line.str === 'Total') {
                reachedTotals = true
              }
              transactionDesc += `${line.str}\n`
              return
            }

            // Withdrawals col
            if (transactionDesc && !reachedTotals && Math.abs((line.transform[4] + line.width) - headers[2].right) < ACCEPTABLE_DIFF) {
              withdrawals = parseFloat(line.str.replace(',', ''))
              return
            }

            // Deposits col
            if (transactionDesc && !reachedTotals && Math.abs((line.transform[4] + line.width) - headers[3].right) < ACCEPTABLE_DIFF) {
              deposits = parseFloat(line.str.replace(',', ''))
              return
            }

            // Balance col
            if (transactionDesc && Math.abs((line.transform[4] + line.width) - headers[4].right) < ACCEPTABLE_DIFF) {
              balance = parseFloat(line.str.replace(',', ''))
              if (!reachedTotals) {
                const description = transactionDesc.trim()
                if (description === 'BALANCE B/F') {
                  accounts[account].startingBalance = balance
                } else {
                  accounts[account].transactions.push({
                    date: DateTime.fromFormat(date, 'd MMM yyyy').toFormat('yyyy-MM-dd'),
                    description,
                    withdrawals,
                    deposits,
                    balance
                  })
                }

              } else {
                accounts[account].endingBalance = balance
              }
              return
            }

          }

          // End
          if (isParsing && headers.length === 5 && account && regexEnd.test(line.str)) {
            account = ''
            headers = []
            isParsing = false
            return
          }

          if (line.str === STOP_PARSE) {
            isEnd = true
            account = ''
            headers = []
            isParsing = false
            return
          }
        })

        return '';
      });
  }


  return pdf(buf, { max: 0, version: 'v2.0.550', pagerender: renderPage })
    .then(() => {
      // Compute interests and other fields
      Object.keys(accounts).forEach(account => {
        accounts[account].interest = accounts[account].transactions.reduce((sum, txn) => {
          if (txn.description === 'One Bonus Interest' || txn.description === 'Interest Credit') {
            return sum + txn.deposits
          }
          return sum
        }, 0)

        accounts[account].totalWithdrawals = accounts[account].transactions.reduce((sum, txn) => {
          return sum + txn.withdrawals
        }, 0)

        accounts[account].totalDeposits = accounts[account].transactions.reduce((sum, txn) => {
          return sum + txn.deposits
        }, 0)

        accounts[account].transactions.forEach((txn, i) => {
          if (txn.description === 'One Bonus Interest' || txn.description === 'Interest Credit') {
            txn.category = 'Interest'
          } else if (/Salary/i.test(txn.description)) {
            txn.category = 'Salary'
          } else if (/Phillip Securities|Asia Wealth Platform/ig.test(txn.description)) {
            txn.category = 'Investments'
          } else if (/AVIVA/ig.test(txn.description)) {
            txn.category = 'Insurance'
          } else if (/STARHUB/ig.test(txn.description)) {
            txn.category = 'Utilities'
          } else if (/IRAS/ig.test(txn.description)) {
            txn.category = 'Taxes'
          } else if (/UOB CARD CENTRE|UOB Cards/ig.test(txn.description)) {
            txn.category = 'Credit Card Payment'
          } else if (/TRANSITLIN/ig.test(txn.description)) {
            txn.category = 'Transport'
          } else {
            txn.category = 'Unknown'
          }

          txn.statement = `uob-bank-${statementYearMonth}`
          txn.accountName = accounts[account].accountName
          txn.accountNumber = accounts[account].accountNumber
          txn.amount = txn.deposits - txn.withdrawals
          txn.type = 'CASH'
          delete txn.withdrawals
          delete txn.deposits
          txn.id = `${txn.date}-${i}`
        })
      })

      const date = DateTime.fromFormat(`${statementYearMonth}01`, 'yyyyMMdd')
      return {
        statementId: `uob-bank-${statementYearMonth}`,
        startDate: statementDate.startOf('month').toFormat('yyyy-MM-dd'),
        endDate: statementDate.endOf('month').toFormat('yyyy-MM-dd'),
        accounts
      }
    })
}
