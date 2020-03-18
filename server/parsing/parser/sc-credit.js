const pdf = require('pdf-parse')
const dayjs = require('dayjs')
const pdfOpts = {
  normalizeWhitespace: false,
  disableCombineTextItems: false
}

const accounts = {}
let statementDate
let statementYear
let cardName
let cardPrevBalance

module.exports = (buf) => {
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

        // Statement date
        if (!statementDate && item.text === 'Statement Date') {
          if (processed[idx + 2].text.match(/^\d{1,2} \w{3} \d{4}$/)) {
            statementDate = dayjs(processed[idx + 2].text, 'DD MMM YYYY')
            statementYear = statementDate.format('YYYY')
            processedIdx = idx + 2
            return
          }
        }

        // if (processedIdx > idx) return

        // PREVIOUS BALANCE
        if (item.text === 'PREVIOUS BALANCE') {
          // look back to find card name
          const cardStr = `${processed[idx - 3].text} ${processed[idx - 1].text}`
          if (cardStr.match(/^\d{4} .*/)) {
            cardName = cardStr.replace(/\s+/g, ' ')

            if (!(cardName in accounts)) {
              accounts[cardName] = {
                name: cardName,
                transactions: [],
                startingBalance: 0,
                endingBalance: 0
              }
            }
          }

          // Get prev balance value
          const prevBalanceStr = processed[idx + 1].text.replace(',', '')
          cardPrevBalance = -1 * parseFloat(prevBalanceStr)
          accounts[cardName].startingBalance = cardPrevBalance

          processedIdx = idx + 1
          return
        }

        // Transaction row
        if (cardName && item.text.match(/^\d{1,2} \w{3}$/) && processed[idx + 1].text.match(/^\d{1,2} \w{3}$/)) {
          const description = []
          const txn = {
            date: null,
            description: '',
            amount: 0,
            balance: 0
          }

          // Txn date
          txn.date = dayjs(`${item.text} ${statementYear}`, 'D MMM YYYY').format('YYYY-MM-DD')

          // Find for next txn row or "NEW BALANCE" followed by dollar value
          let lookAheadIdx = idx + 1
          let endIdx
          while (processed[lookAheadIdx]) {
            const str = processed[lookAheadIdx].text

            // New txn row
            if (str.match(/^\d{1,2} \w{3}$/) && processed[lookAheadIdx + 1].text.match(/^\d{1,2} \w{3}$/)) {
              endIdx = lookAheadIdx
              break
            }

            // End
            // if (str === 'NEW BALANCE' && processed[lookAheadIdx + 2].text.replace(',', '').match(/^\d+(\.\d{2})(CR)?$/)) {
            if (str === 'NEW BALANCE') {
              endIdx = lookAheadIdx
              break
            }

            lookAheadIdx += 1
          }

          // Transaction amount is @ endIdx-1
          txn.amount = -1 * parseFloat(processed[endIdx-1].text.replace(',', ''))
          if (processed[endIdx-1].text.endsWith('CR')) {
            txn.amount *= -1
          }
          cardPrevBalance += txn.amount
          txn.balance = cardPrevBalance


          // Description is in between
          for (let i = idx + 2; i < endIdx - 2; i++) {
            description.push(processed[i].text)
          }
          txn.description = description.join(' ')
          if (txn.description.match(/BUS\/MRT|Grab/)) {
            txn.category = 'Transport'
          } else if (txn.description.match(/XINDOTS/)) {
            txn.category = 'Food'
          } else if (txn.description.match(/NTUC FP|FAIRPRICE|COLD STORAGE|PHOON HUAT/)) {
            txn.category = 'Groceries'
          } else if (txn.description.match(/CASHBACK/)) {
            txn.category = 'Cashback'
          } else if (txn.description.match(/GIRO PAYMENT/)) {
            txn.category = 'Credit Card Payment'
          } else if (txn.description.match(/iHerb/)) {
            txn.category = 'Online'
          } else {
            txn.category = 'Unknown'
          }

          accounts[cardName].transactions.push(txn)

          processedIdx = endIdx - 2
          return
        }

        if (cardName && item.text === 'NEW BALANCE') {
          accounts[cardName].endingBalance = -1 * parseFloat(processed[idx + 1].text.replace(',', ''))
          cardName = null
          cardPrevBalance = 0

          stop = true
          return
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
        type: 'scCredit',
        assetType: 'credit',
        accounts
      }
      return statementData
    })
    .catch(err => console.error('error:', err))
}
