const pdf = require('pdf-parse')
const dayjs = require('dayjs')
const pdfOpts = {
  normalizeWhitespace: false,
  disableCombineTextItems: false
}

module.exports = class DbsCreditParser {
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
            if (content.y > 771) return false
            if (content.x > 593) return false
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

        let processedIdx = 0
        let stop = false
        processed.forEach((item, idx) => {
          if (stop) return

          // Determine statement date
          if (!statementDate) {
            if (item.text !== 'STATEMENT DATE') return

            const stmtDateStr = processed[idx + 4].text
            if (!(/^\d+ \w{3} \d{4}$/.test(stmtDateStr))) {
              throw new Error('Expected statement date')
            }
            statementDate = dayjs(stmtDateStr, 'D MMM YYYY')
            statementYear = statementDate.format('YYYY')
            processedIdx = idx + 4
            return
          }

          // skip rows
          if (processedIdx > idx) return

          // Find credit card name header
          if (!cardName) {
            if (/CARD NO\.:/.test(item.text)) {
              const [name, number] = item.text.split('CARD NO.:')
              const lastFourDigits = number.substr(number.length - 4)
              cardName = `${name} ${lastFourDigits}`
              accounts[cardName] = {
                name: cardName,
                transactions: [],
                startingBalance: 0,
                endingBalance: 0
              }
              return
            }
          }

          // Special: Previous balance
          if (item.text === 'PREVIOUS BALANCE' && !cardPrevBalance) {
            const prevBalanceStr = processed[idx+1].text.replace(',', '')

            if (/^\d+(\.\d{2})?$/.test(prevBalanceStr)) {
              cardPrevBalance = -1 * parseFloat(prevBalanceStr)
              accounts[cardName].startingBalance = cardPrevBalance
              return
            }
          }

          // Transactions: Find a date column 1st
          if (/^\d{2} \w{3}$/.test(item.text) && Math.abs(item.x - 64) < 5) {
            const txn = {
              date: null,
              description: '',
              amount: 0,
            }
            txn.date = dayjs(`${item.text} ${statementYear}`, 'DD MMM YYYY').format('YYYY-MM-DD')
            let description = []

            let lookAheadIdx = idx + 1

            while (true) {
              // If EOP, next date, Subtotal, New Txns, Totals line
              // console.log('>>>', processed[lookAheadIdx] && processed[lookAheadIdx].text)
              if (!processed[lookAheadIdx] ||
              /^\d{2} \w{3}$/.test(processed[lookAheadIdx].text) && Math.abs(processed[lookAheadIdx].x - 64) < 5 ||
              processed[lookAheadIdx].text.startsWith('NEW TRANSACTIONS') ||
              processed[lookAheadIdx].text === 'TOTAL:' ||
              processed[lookAheadIdx].text === 'SUB-TOTAL:') {
                txn.description = description.join('\n')

                // categorize
                if (txn.description.match(/PAYMENT - DBS INTERNET|AUTO-PYT FROM ACCT/)) {
                  txn.category = 'Credit Card Payment'
                } else if (txn.description.match(/AGODA\.COM|YOUTRIP/)) {
                  txn.category = 'Travel'
                } else if (txn.description.match(/CIRCLES\.LIFE|GIGA/)) {
                  txn.category = 'Utilities'
                } else if (txn.description.match(/NTUC FP|PHOON HUAT|Fairprice/i)) {
                  txn.category = 'Groceries'
                } else if (txn.description.match(/iHerb|shopee/i)) {
                  txn.category = 'Online'
                } else if (txn.description.match(/PURE FITNESS/)) {
                  txn.category = 'Health & Wellness'
                } else if (txn.description.match(/EZ-LINK EZ-RELOAD|BUS\/MRT/)) {
                  txn.category = 'Transport'
                } else if (txn.description.match(/CASHBACK/)) {
                  txn.category = 'Cashback'
                } else {
                  txn.category = 'Unknown'
                }

                cardPrevBalance += txn.amount
                txn.balance = cardPrevBalance

                accounts[cardName].transactions.push(txn)

                break
              }

              // Look ahead for description
              if (Math.abs(processed[lookAheadIdx].x - 107) < 5) {
                description.push(processed[lookAheadIdx].text)
                lookAheadIdx += 1
                continue
              }

              // Look ahead for amt / CR
              if (processed[lookAheadIdx].x > 476) {
                const number = processed[lookAheadIdx].text.replace(',', '')
                if (/^\d+(\.\d{2})?$/.test(number)) {
                  txn.amount = -1 * parseFloat(number)
                }

                if (processed[lookAheadIdx].text === 'CR') {
                  txn.amount = Math.abs(txn.amount)
                }

                lookAheadIdx += 1
                continue
              }
            }

            // If "GRAND TOTAL FOR ALL CARD ACCOUNTS"
            if (item.text === 'GRAND TOTAL FOR ALL CARD ACCOUNTS') {
              return stop = true
            }
          }

          if (item.text === 'TOTAL:') {
            stop = true

            // Get the ending balance
            const endBalanceStr = processed[idx + 1].text.replace(',', '')
            if (!/^\d+\.\d{2}$/.test(endBalanceStr)) {
              throw new Error('Expected ending balance')
            }
            accounts[cardName].endingBalance = -1 * parseFloat(endBalanceStr)
            cardName = null

            return
          }

          return
        })
      } catch (err) {
        console.log('render page error', err)
      }
    }

    return pdf(buf, { max: 0, version: 'v2.0.550', pagerender: renderPage })
      .then(() => {
        return {
          yearMonth: parseInt(statementDate.format('YYYYMM'), 10),
          type: 'dbsCredit',
          assetType: 'credit',
          accounts: Object.values(accounts)
        }
      })
      .catch(err => console.error('error:', err))
  }

}
