const pdf = require('pdf-parse')
const dayjs = require('dayjs')
const pdfOpts = {
  normalizeWhitespace: false,
  disableCombineTextItems: false
}

module.exports = class CdpParser {
  async parse(buf) {
    const accounts = {}
    let statementDate
    let statementYear
    let cardName
    let cardPrevBalance

    let cdpNumber
    let cdpEndingBalance

    const renderPage = async (data) => {
      try {
        const textContent = await data.getTextContent(pdfOpts)
        const processed = textContent.items
          .map(content => ({
            text: content.str.trim(),
            x: content.transform[4],
            y: content.transform[5]
          }))
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

          if (processedIdx > idx) return

          // Statement date
          if (!statementDate && item.text.startsWith('SECURITIES A/C NO. XXXX-XXXX-')) {
            const dateStr = processed[idx + 1].text
            if (!dateStr.match(/^\w{3} \d{4}$/)) throw new Error(`Unexpected statement date string: ${dateStr}`)

            statementDate = dayjs(`01 ${dateStr}`, 'DD MMM YYYY')

            cdpNumber = item.text.substr(-4)
            return
          }

          if (!statementDate) return

          if (statementDate.isBefore('2018-12-01')) return

          // Ending balance
          if (item.text === 'Total Balance') {
            cdpEndingBalance = parseFloat(processed[idx + 2].text.replace(','))
            processedIdx = idx + 2

            return
          }

          // Stock holding (aka accounts)
          if (item.text === 'Securities Holdings') {
            if (processed[idx + 1].text === 'Security'
              && processed[idx + 2].text === 'Free'
              && processed[idx + 3].text === 'Blocked'
              && processed[idx + 12].text === '(1+2)x(3)'
            ) {
              let currIdx = idx + 15
              while (true) {
                const stock = processed[currIdx].text
                const numStocks = parseInt(processed[currIdx + 3].text.replace(',', ''))
                const marketValue = parseFloat(processed[currIdx + 5].text.replace(',', ''))

                if (stock.match(/^TOTAL: \w{3}$/)) {
                  break
                }

                if (!(stock in accounts)) {
                  accounts[stock] = {
                    name: stock,
                    transactions: [],
                    endingBalance: marketValue,
                    numStocks,
                  }
                }


                currIdx += 6
              }

              processedIdx = currIdx
              return
            }
          }

          // Transactions
          if (item.text === 'Securities Transaction'
            && processed[idx + 1].text === 'Security'
            && processed[idx + 2].text === 'Date'
            && processed[idx + 5].text === 'Balance'
            && (
              processed[idx + 1].text !== 'Cash Transaction'
              || processed[idx + 1].text !== 'Your Securities Account is Linked To'
            )
          ) {
            let currIdx = idx + 6

            while (processed[currIdx] && !processed[currIdx].text.match(/^Cash Transaction|Your Securities Account is Linked To$/)) {
              const stock = processed[currIdx].text
              const date = processed[currIdx + 3].text
              const [d, m, y] = date.split('/')
              const description = processed[currIdx + 4].text
              const isPositive = processed[currIdx + 5].text.substr(0, 1) === '+'
              const adjustment = parseInt(processed[currIdx + 5].text.replace(/[,+-]/, ''), 10)

              accounts[stock].transactions.push({
                date: `${y}-${m}-${d}`,
                description,
                numStockChange: (isPositive ? 1 : -1) * adjustment
              })

              currIdx += 7
            }
          }

          // Dividends
          if (item.text === 'Cash Transaction'
            && processed[idx + 2].text === 'Date'
            && processed[idx + 3].text === 'Description'
            && processed[idx + 5].text === 'Paid'
            && processed[idx + 1].text !== 'Your Securities Account is Linked To'
          ) {
            let currIdx = idx + 6
            while (processed[currIdx] && processed[currIdx].text !== 'Your Securities Account is Linked To') {
              const [d, m, y] = processed[currIdx].text.split('/')
              const date = `${y}-${m}-${d}`
              const description = processed[currIdx + 1].text
              const amount = parseFloat(processed[currIdx + 2].text.replace(',', ''))

              if (!description.match(/^(Balance B\/F|Balance C\/F|Payment Made)/)) {
                const stockMatch = /([A-Z0-9 ]+) (.*)/.exec(description)

                if (!stockMatch) continue
                const [, stock, desc] = stockMatch

                if (stock && desc) {
                  accounts[stock].transactions.push({
                    date,
                    description,
                    amount
                  })
                }
              }

              currIdx += 3
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
        if (!statementDate) return
        const statementData = {
          yearMonth: parseInt(statementDate.format('YYYYMM'), 10),
          type: 'cdp',
          assetType: 'invest',
          accounts: Object.values(accounts)
        }
        return statementData
      })
      .catch(err => console.error('error:', err))
  }
}
