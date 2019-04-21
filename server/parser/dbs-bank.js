const pdf = require('pdf-parse')
const {DateTime} = require('luxon')

const TOP = 721
const BOTTOM = 47
const LEFT = 48
const RIGHT = 700

const regexAccountDetails = /^ACCOUNT DETAILS/
const regexAccountNo = /^Account No\.?/
const regexTransactionDate = /^(\d{2} \w{3})$/
const regexValue = /^(\d+\,)?\d+\.\d{2}$/

module.exports = function (buf) {
  let statementDate
  const statementData = {
    statementId: '',
    startDate: '',
    endDate: '',
    accounts: {
      /**
       * AccountId: {
       *    startingBalance,
       *    endingBalance,
       *    interest,
       *    accountName,
       *    accountNumber,
       *    totalWithdrawals,
       *    totalDeposits,
       *    transactions: [
       *      {
       *        date,
       *        description,
       *        balance,
       *        category,
       *        statement,   // eg. dbs-YYYYMM
       *        accountName,
       *        accountNumber,
       *        amount,
       *        type,
       *        id // establish order in day
       *      }
       *    ]
       * }
       */
    }
  }

  const renderPage = (data) => {
    const opts = {
      normalizeWhitespace: false,
      disableCombineTextItems: false
    }

    // column x coords
    let dateStartX
    let descriptionStartX
    let withdrawalStartX
    let withdrawalEndX
    let depositStartX
    let depositEndX
    let balanceStartX
    let balanceEndX

    return data.getTextContent(opts)
      .then((textContent) => {
        const contentArea = textContent.items.filter((item) => {
          const x = item.transform[4]
          const y = item.transform[5]

          return (x > LEFT && x < RIGHT && y < TOP && y > BOTTOM)
        })

        // Find for ACCOUNT DETAILS (to get date)
        const accountDetails = contentArea.find(item => item.str.match(regexAccountDetails))
        if (!accountDetails) {
          if (!statementDate) {
            // console.error('Cannot find account details line')
            throw new Error('Cannot find account details line')
          }
        } else {
          const accountDetailsLine = contentArea.filter(item => item.transform[5] === accountDetails.transform[5])
          if (accountDetailsLine.length !== 2) {
            console.error('Unexpected number for account details line')
            throw new Error('Unexpected number for account details line')
          }
          if (!accountDetailsLine[1].str.match(/^\d{2} \w{3} \d{4}$/)) {
            console.error('Incorrect date format for account details line')
            throw new Error('Incorrect date format for account details line')
          }

          statementDate = DateTime.fromFormat(accountDetailsLine[1].str, 'dd MMM yyyy')
          statementData.statementId = `dbs-${statementDate.toFormat('yyyy-MM')}`
          statementData.statementYearMonth = statementDate.toFormat('yyyyMM')
          statementData.startDate = statementDate.startOf('month').toFormat('yyyy-MM-dd')
          statementData.endDate = statementDate.endOf('month').toFormat('yyyy-MM-dd')
        }

        // Find for "Account No." (start of account details)
        const accNoItems = contentArea.filter(item => item.str.match(regexAccountNo))

        let accountName
        let accountNumber
        let row
        let balance

        const appendRow = (row) => {
          if (!row) return

          row.description = row.description.trim()

          balance += row.deposit - row.withdrawal
          row.balance = parseFloat(balance.toFixed(2))

          statementData.accounts[`${accountName} ${accountNumber}`].transactions.push(row)
        }

        accNoItems.forEach(item => {
          // Get the account name/type using y coord
          const y = item.transform[5]
          const accDetails = contentArea
          .map((item, i) => {
            if (item.transform[5] === y) return [item, i]
          })
          .filter(o => Boolean(o))
          accountName = accDetails[0][0].str.trim()
          accountNumber = accDetails[accDetails.length - 1][0].str.trim()
          statementData.accounts[`${accountName} ${accountNumber}`] = {
            transactions: [],
            accountName,
            accountNumber
          }

          // get the table header row
          const headerY = contentArea[accDetails[accDetails.length - 1][1]+1].transform[5]
          const headerRow = contentArea
            .map((item, i) => {
              if (item.transform[5] === headerY) return [item, i]
            })
            .filter(o => Boolean(o))

          if (headerRow.length !== 5) {
            console.error('Unexpected header row length')
            throw new Error('Unexpected header row length')
          }
          if (!(headerRow[0][0].str.startsWith('Date') &&
            headerRow[1][0].str.startsWith('Description') &&
            headerRow[2][0].str.startsWith('Withdrawal') &&
            headerRow[3][0].str.startsWith('Deposit') &&
            headerRow[4][0].str.startsWith('Balance'))) {
            console.warn('Unexpected header row contents')
            throw new Error('Unexpected header row contents')
          }

          dateStartX = headerRow[0][0].transform[4]
          descriptionStartX = headerRow[1][0].transform[4]
          withdrawalStartX = headerRow[2][0].transform[4]
          withdrawalEndX = headerRow[2][0].transform[4] + headerRow[2][0].width
          depositStartX = headerRow[3][0].transform[4]
          depositEndX = headerRow[3][0].transform[4] + headerRow[3][0].width
          balanceStartX = headerRow[4][0].transform[4]
          balanceEndX = headerRow[4][0].transform[4] + headerRow[4][0].width

          for (let x = headerRow[4][1] + 1; x < contentArea.length; x++) {
            const item = contentArea[x]
            const itemStartX = item.transform[4]
            const itemEndX = item.transform[4] + item.width

            if (itemStartX >= dateStartX && itemEndX <= descriptionStartX) {
              // Date column starts from dateStartX and ends before descriptionStartX
              if (item.str.trim().length === 0) {
                continue
              }
              if (item.str === 'CURRENCY:') {
                x += 1
                continue
              }
              if (!item.str.match(regexTransactionDate)) {
                console.warn(`Transaction date invalid format "${item.str}"`)
                continue
              }

              appendRow(row)
              row = {
                date: '',
                description: '',
                withdrawal: 0,
                deposit: 0,
                balance: 0,
                accountName,
                accountNumber,
                // type: 'CASH'
              }
              row.date = DateTime.fromFormat(`${item.str} ${statementDate.toFormat('yyyy')}`, 'dd MMM yyyy').toFormat('yyyy-MM-dd')
            } else if (itemStartX >= descriptionStartX && itemEndX <= withdrawalStartX) {
              if (item.str === 'Total') {
                appendRow(row)

                // Get this rows' columns
                const totals = contentArea.filter(o => o.transform[5] === item.transform[5])
                if (totals.length !== 4) {
                  console.warn(`Unexpected columns in totals row (${totals.length})`)
                  break
                }
                statementData.accounts[`${accountName} ${accountNumber}`].totalWithdrawals = parseFloat(totals[2].str.replace(',', ''))
                statementData.accounts[`${accountName} ${accountNumber}`].totalDeposits = parseFloat(totals[3].str.replace(',', ''))
                x += 2
                row = undefined
                continue
              }
              if (item.str === 'Balance Brought Forward') {
                if (typeof statementData.accounts[`${accountName} ${accountNumber}`].startingBalance !== 'undefined') {
                  x += 1
                  continue
                } else {
                  const startBalance = contentArea.filter(o => o.transform[5] === item.transform[5])
                  if (startBalance.length !== 2) {
                    console.warn('Unexpected columns in startBalance row')
                    break
                  }

                  balance = parseFloat(startBalance[1].str.replace(',', ''))
                  statementData.accounts[`${accountName} ${accountNumber}`].startingBalance = balance
                  x += 1
                  continue
                }
              }
              if (item.str === 'Balance Carried Forward') {
                // End of page, but going to continue into next page
                if (typeof statementData.accounts[`${accountName} ${accountNumber}`].endingBalance === 'undefined') {
                  appendRow(row)
                }

                // Get this rows' columns
                const endBalance = contentArea.filter(o => o.transform[5] === item.transform[5])
                if (endBalance.length !== 2) {
                  console.warn('Unexpected columns in endBalance row')
                  break
                }
                statementData.accounts[`${accountName} ${accountNumber}`].endingBalance = parseFloat(endBalance[1].str.replace(',', ''))
                break

              }

              row.description += `${item.str}\n`
            } else {
              // The remaining columns should be all values
              if (!item.str.match(regexValue)) {
                console.warn(`Unexpected value "${item.str}"`)
                continue
              }

              const value = parseFloat(item.str.replace(',', ''))
              // Values are all right aligned. Check which column the itemEnd falls into
              if (itemEndX <= withdrawalEndX) {
                row.withdrawal = value
              } else if (itemEndX <= depositEndX) {
                row.deposit = value
              }
            }
          }
        })
      })
  }

  return pdf(buf, { max: 0, version: 'v2.0.550', pagerender: renderPage })
    .then(() => {
      const idPrefix = `cash-dbs${statementDate.toFormat('yyyyMM')}`

      Object.keys(statementData.accounts).forEach((accountId) => {
        const accIdForPrefix = accountId.toLowerCase().replace(/[\s-]/g, '')

        statementData.accounts[accountId].transactions.forEach((txn, i) => {
          if (txn.description === 'Interest Earned') {
            txn.category = 'Interest'
          } else if (txn.description.match(/\bSalary\b/)) {
            txn.category = 'Salary'
          } else if (txn.description.match(/\bSINGTEL\b/)) {
            txn.category = 'Utilities'
          } else if (txn.description.match(/\bAVIVA\b/)) {
            txn.category = 'Insurance'
          } else if (txn.description.match(/\bDividends\/Cash Distribution|PHILLIP SECURITIES|NIKKO AM SINGAPORE STI ETF|I-BANK-STI ETF Rfd\b|SSB-GX/)) {
            txn.category = 'Investments'
          } else if (txn.description.match(/\b(TRANSITLIN|TRANSIT LI|ez-link Card Top-up)\b/)) {
            txn.category = 'Transport'
          } else if (txn.description.match(/Standing Instruction.*(LIM HONG YIN|NEO GEOK LAN)/)) {
            txn.category = 'Family'
          } else if (txn.description.match(/(Standing Instruction|Funds Transfer)/)) {
            txn.category = 'Transfers'
          } else if (txn.description.match(/(CARD CENTRE)/)) {
            txn.category = 'Credit Card Payment'
          } else if (txn.description.match(/Cash Withdrawal/)) {
            txn.category = 'Withdrawal'
          } else {
            txn.category = 'Unknown'
          }

          txn.amount = txn.deposit - txn.withdrawal
          txn.id = `${idPrefix}-${accIdForPrefix}-${txn.date.replace(/[\W\D]/g, '')}-${i}`
          delete txn.accountName
          delete txn.accountNumber
          delete txn.deposit
          delete txn.withdrawal
        })
      })
      return statementData
    })
}
