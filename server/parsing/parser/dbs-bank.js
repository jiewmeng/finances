const pdf = require('pdf-parse')
const dayjs = require('dayjs')

const TOP = 721
const BOTTOM = 47
const LEFT = 48
const RIGHT = 700

const regexAccountDetails = /^ACCOUNT DETAILS/
const regexAccountNo = /^Account No\.?/
const regexTransactionDate = /^(\d{2} \w{3})$/
const regexValue = /^(\d+\,)?\d+\.\d{2}$/

module.exports = class DbsParser {
  async parse(buf) {
    let statementDate
    const statementData = {
      startDate: null,
      endDate: null,
      accounts: {}
    }
    let balance
    let row
    let accountName
    let accountNumber
    let stop = false

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

            statementDate = dayjs(accountDetailsLine[1].str, 'DD MMM YYYY')
            statementData.yearMonth = parseInt(statementDate.format('YYYYMM'), 10)
            statementData.type = 'dbs'
            statementData.assetType = 'bank'
            statementData.startDate = statementDate.startOf('month').format('YYYY-MM-DD')
            statementData.endDate = statementDate.endOf('month').format('YYYY-MM-DD')
          }

          // Find for "Account No." (start of account details)
          const accNoItems = contentArea.filter(item => item.str.match(regexAccountNo))

          const appendRow = () => {
            if (!row) return

            row.description = row.description.trim()

            balance += row.deposit - row.withdrawal
            row.balance = parseFloat(balance.toFixed(2))

            statementData.accounts[`${accountName} ${accountNumber}`].transactions.push(row)
            row = undefined
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
            if (!statementData.accounts[`${accountName} ${accountNumber}`]) {
              statementData.accounts[`${accountName} ${accountNumber}`] = {
                transactions: [],
                name: `${accountName} ${accountNumber}`
              }
            }

            // get the table header row
            const headerY = contentArea[accDetails[accDetails.length - 1][1]+1].transform[5]
            const headerRow = contentArea
              .map((item, i) => {
                if (item.transform[5] === headerY) return [item, i]
              })
              .filter(o => Boolean(o))

            if (headerRow.length !== 5) {
              return
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
                  // name: `${accountName} ${accountNumber}`,
                  // type: 'CASH'
                }
                row.date = dayjs(`${item.str} ${statementDate.format('YYYY')}`, 'DD MMM YYYY').format('YYYY-MM-DD')
              } else if (itemStartX >= descriptionStartX && itemEndX <= withdrawalStartX) {
                // Description
                if (item.str === 'Total') {
                  appendRow(row)
                  row = undefined

                  // Get this rows' columns
                  const totals = contentArea.filter(o => o.transform[5] === item.transform[5])
                  if (totals.length === 4) {
                    // statementData.accounts[`${accountName} ${accountNumber}`].totalWithdrawals = parseFloat(totals[2].str.replace(',', ''))
                    // statementData.accounts[`${accountName} ${accountNumber}`].totalDeposits = parseFloat(totals[3].str.replace(',', ''))
                    x += 2
                  } else if (totals.length === 3) {
                    // statementData.accounts[`${accountName} ${accountNumber}`].totalWithdrawals = parseFloat(totals[1].str.replace(',', ''))
                    // statementData.accounts[`${accountName} ${accountNumber}`].totalDeposits = parseFloat(totals[2].str.replace(',', ''))
                    x += 1
                  } else {
                    console.warn(`Unexpected columns in totals row (${totals.length})`)
                    break
                  }

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
                if (!row) continue

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
        Object.keys(statementData.accounts).forEach((accountId) => {
          statementData.accounts[accountId].transactions.forEach((txn, i) => {
            if (txn.description === 'Interest Earned') {
              txn.category = 'Interest'
            } else if (txn.description.match(/\bSalary\b/)) {
              txn.category = 'Salary'
            } else if (txn.description.match(/\bSINGTEL\b/)) {
              txn.category = 'Utilities'
            } else if (txn.description.match(/\bAVIVA\b|NTUC INCOME/)) {
              txn.category = 'Insurance'
            } else if (txn.description.match(/\bDividends\/Cash Distribution|PHILLIP SECURITIES|NIKKO AM SINGAPORE STI ETF|I-BANK-STI ETF Rfd\b|SSB-GX|Unit Trust Application|ASIA WEALTH PLATFORM/)) {
              txn.category = 'Investments'
            } else if (txn.description.match(/\b(TRANSITLIN|TRANSIT LI|ez-link Card Top-up)\b/)) {
              txn.category = 'Transport'
            } else if (txn.description.match(/Standing Instruction.*(LIM HONG YIN|NEO GEOK LAN)/)) {
              txn.category = 'Family'
            } else if (txn.description.match(/(Standing Instruction|Funds Transfer|Advice FAST Payment.*I\-BANK)/gm)) {
              txn.category = 'Transfers'
            } else if (txn.description.match(/(CARD CENTRE)/)) {
              txn.category = 'Credit Card Payment'
            } else if (txn.description.match(/Cash Withdrawal/)) {
              txn.category = 'Withdrawal'
            } else if (txn.description.match(/Incoming PayNow/)) {
              txn.category = 'PayNowIn'
            } else {
              txn.category = 'Unknown'
            }

            txn.amount = txn.deposit - txn.withdrawal
            // txn.id = `${idPrefix}-${accIdForPrefix}-${txn.date.replace(/[\W\D]/g, '')}-${i}`
            delete txn.deposit
            delete txn.withdrawal
          })
        })
        statementData.accounts = Object.values(statementData.accounts)
        return statementData
      })
  }
}
