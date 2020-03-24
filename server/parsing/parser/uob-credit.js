const pdf = require('pdf-parse')
const dayjs = require('dayjs')
const pdfOpts = {
  normalizeWhitespace: false,
  disableCombineTextItems: false
}

module.exports = class UobCreditParser {
  async parse(buf) {
    const accounts = {}
    let statementDate
    let statementYear
    let cardName
    let cardPrevBalance

    const renderPage = async (data) => {
      try {
        const textContent = await data.getTextContent(pdfOpts)
        const processed = textContent.items
          .map(content => ({
            text: content.str.trim(),
            x: content.transform[4],
            y: content.transform[5]
          }))
          .filter(content => {
            if (content.y < 47) return false
            return true
          })
          .sort((a, b) => {
            const diffY = a.y - b.y
            const absDiffY = Math.abs(diffY)
            const diffX = a.x - b.x

            if (diffY > 0 && absDiffY > 2) return -1
            if (diffY < 0 && absDiffY > 2) return 1
            if (diffX < 0) return -1
            if (diffX > 0) return 1
            return 0
          })

        let foundHeader = false
        let processedIdx = 0
        let stop = false
        processed.forEach((item, idx) => {
          if (stop) return

          // Get statement date
          if (!statementDate) {
            if (item.text === 'Statement Date') {
              statementDate = dayjs(processed[idx + 1].text.replace('  ', ' '), 'D MMM YYYY')
              statementYear = statementDate.format('YYYY')
              processedIdx = idx + 1
            }
            return
          }

          // Find header (Post - Trans - Description of Transaction - Transaction Amount - Date - Date - SGD)
          if (item.text === 'Post' &&
            processed[idx + 1].text === 'Trans' &&
            processed[idx + 2].text === 'Description of Transaction' &&
            processed[idx + 3].text === 'Transaction Amount' &&
            processed[idx + 4].text === 'Date' &&
            processed[idx + 5].text === 'Date') {

            // Look back to get card name and number
            cardName = `${processed[idx - 3].text} ${processed[idx - 2].text.split('-')[3]}`
            if (!(cardName in accounts)) {
              accounts[cardName] = {
                name: cardName,
                transactions: [],
                startingBalance: 0,
                endingBalance: 0
              }
            }
            processedIdx = idx + 6

            return
          }

          if (cardName) {
            const description = []
            const txn = {
              date: null,
              description: '',
              amount: 0,
              balance: 0
            }

            // Prev balance/starting balance
            if (item.text === 'PREVIOUS BALANCE') {
              accounts[cardName].startingBalance = -1 * parseFloat(processed[idx + 1].text.replace(',', ''))
              cardPrevBalance = accounts[cardName].startingBalance
              processedIdx = idx + 1
              return
            }

            // Date col
            if (/^\d+ \w{3}$/.test(item.text) &&
            /^\d+ \w{3}$/.test(processed[idx + 1].text)) {
              txn.date = dayjs(`${processed[idx + 1].text} ${statementYear}`, 'DD MMM YYYY').format('YYYY-MM-DD')
              description.push(processed[idx + 2].text)
              txn.amount = -1 * parseFloat(processed[idx + 3].text.replace(',', ''))

              let lookAheadIdx = idx + 4
              // Handle credit txns
              if (processed[lookAheadIdx].text === 'CR') {
                txn.amount *= -1
                lookAheadIdx += 1
              }

              cardPrevBalance += txn.amount
              txn.balance = cardPrevBalance

              // More descriptions
              while (processed[lookAheadIdx] &&
                !(/^\d+ \w{3}$/.test(processed[lookAheadIdx].text)) &&
                processed[lookAheadIdx].text !== 'SUB TOTAL') {
                description.push(processed[lookAheadIdx].text)
                lookAheadIdx += 1
              }

              // Push transaction
              txn.description = description.join('\n')
              accounts[cardName].transactions.push(txn)
              processedIdx = lookAheadIdx

              // Categorize
              if (txn.description.match(/NTUC FP|FAIRPRICE|COLD STORAGE|GIANT-|PHOON HUAT PL|M \& S/)) {
                txn.category = 'Groceries'
              } else if (txn.description.match(/GIRO PAYMENT|PAYMT THRU E-BANK/)) {
                txn.category = 'Credit Card Payment'
              } else if (txn.description.match(/IHERB|Shopee/)) {
                txn.category = 'Online'
              } else if (txn.description.match(/BUS\/MRT|TRANSIT|Grab Singapore/)) {
                txn.category = 'Transport'
              } else if (txn.description.match(/CIRCLES\.LIFE SINGAPORE/)) {
                txn.category = 'Utilities'
              } else {
                txn.category = 'Unknown'
              }

              return
            }

            // Skip Sub Total
            if (item.text === 'SUB TOTAL') {
              processedIdx = idx + 1
              return
            }

            // Totals
            if (item.text.startsWith('TOTAL BALANCE FOR')) {
              accounts[cardName].endingBalance = -1 * parseFloat(processed[idx + 1].text.replace(',', ''))
              processedIdx = idx + 1

              cardName = null
              cardPrevBalance = 0
              return
            }

            // End of txn details
            if (item.text.match(/End of Transaction Details/)) {
              stop = true
              return
            }
          }

          return
        })
        // console.log(JSON.stringify(processed, null, 2))
      } catch (err) {
        console.log('render page error', err)
      }
    }

    return pdf(buf, { max: 0, version: 'v2.0.550', pagerender: renderPage })
      .then(() => {
        const statementData = {
          yearMonth: parseInt(statementDate.format('YYYYMM'), 10),
          type: 'uobCredit',
          assetType: 'credit',
          accounts: Object.values(accounts)
        }
        return statementData
      })
      .catch(err => console.error('error:', err))
  }

}
