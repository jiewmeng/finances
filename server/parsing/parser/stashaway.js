const pdf = require('pdf-parse')
const dayjs = require('dayjs')
const pdfOpts = {
  normalizeWhitespace: false,
  disableCombineTextItems: false
}

module.exports = class StashawayParser {
  async parse(buf) {
    const accounts = []
    let statementDate
    let statementYear
    let cardName
    let cardPrevBalance
    let isProcessingTransactions = false
    let hasReachedFeeCalculations = false
    let txnsAccountName
    let txnsAccountIdx
    let stop = false

    const renderPage = async (data) => {
      try {
        const textContent = await data.getTextContent(pdfOpts)
        let processed = textContent.items
          .map(content => ({
            text: content.str.trim(),
            x: content.transform[4],
            y: content.transform[5],
            w: content.width,
            h: content.height

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

        // Merge same line/horizontal proximity
        const newProcessed = []
        let combined = []
        for (let i = 1; i < processed.length - 1; i++) {
          const prevItem = processed[i - 1]
          const currItem = processed[i]
          if (combined.length === 0) combined = [prevItem]

          if (Math.abs(prevItem.y - currItem.y) < 2) {
            // Same line
            if (Math.abs((prevItem.x + prevItem.w) - currItem.x) < 5) {
              // Very close horizontaly, assume same phrase
              combined.push(currItem)
              continue
            }
          }

          // Different line or not close enuf
          newProcessed.push({
            text: combined.map(item => item.text).join(' '),
            x: combined[0].x,
            y: combined[0].y,
            w: combined[0].w,
            h: combined[0].h,
          })
          combined = [currItem]
        }

        // Attempt to merge with vertical proximity
        // - Sort by x first
        const sortedX = newProcessed.sort((a, b) => {
          if (a.x > b.x) return 1
          if (a.x < b.x) return -1
          if (a.y > b.y) return -1
          if (a.y < b.y) return 1
          return 0
        })

        const processedMergedY = []
        combined = []
        for (let i = 1; i < sortedX.length; i++) {
          const prevItem = sortedX[i - 1]
          const currItem = sortedX[i]
          if (combined.length === 0) combined = [prevItem]

          if (Math.abs(prevItem.x - currItem.x) < 2 && Math.abs(currItem.y + currItem.h - prevItem.y) <= 5) {
            // Likely to be in same "cell"
            combined.push(currItem)
            continue
          }

          // Not close enuf
          processedMergedY.push({
            text: combined.map(item => item.text).join('\n'),
            x: combined[0].x,
            y: combined[0].y,
            w: combined[0].w,
            h: combined[0].h,
          })
          combined = [currItem]
        }

        processedMergedY.push({
          text: combined.map(item => item.text).join('\n'),
          x: combined[0].x,
          y: combined[0].y,
          w: combined[0].w,
          h: combined[0].h,
        })
        // console.log(JSON.stringify(processedMergedY, null, 2))
        // console.log(combined)
        processed = processedMergedY.sort((a, b) => {
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
        let hasFoundPortfolioSummary = false
        let hasFoundPortfolioDetails = false
        processed.forEach((item, idx) => {
          if (stop) return

          if (processedIdx > idx) return

          // Statement date in portfolio summary line
          if (!statementDate
            && item.text === 'Statement of Account'
            && processed[idx + 1].text.match(/^\d{2} \w{3} \d{4} - \d{2} \w{3} \d{4}$/)
          ) {
            const dateStr = processed[idx + 1].text.split('-')[0].trim()
            statementDate = dayjs(dateStr, 'DD MMM YYYY')
            statementYear = statementDate.format('YYYY')
            processedIdx = idx + 1
            return
          }

          if (!hasFoundPortfolioSummary && item.text.match(/^PORTFOLIO SUMMARY \/ \w{3} \d{4}$/)) {
            hasFoundPortfolioSummary = true
          }

          if (!hasFoundPortfolioDetails && item.text.match(/^PORTFOLIO DETAILS \/ \w{3} \d{4}$/)) {
            hasFoundPortfolioDetails = true
          }


          // Portfolio summary for accounts initialization (eg. balances)
          if (hasFoundPortfolioSummary
            && !hasFoundPortfolioDetails
            && item.text.startsWith('Reporting Currency:')
            && processed[idx + 1].text === 'Opening Balance'
            && processed[idx + 2].text === 'Cashflow'
            && processed[idx + 10].text.match(/^\(\d{2} \w{3} \d{4}\)$/)
          ) {
            let cellIdx = idx + 11
            while (true) {
              let account = {
                name: '',
                transactions: [],
                startingBalance: 0,
                endingBalance: 0
              }
              let item = processed[cellIdx]
              if (!item || !processed[cellIdx + 1] || !processed[cellIdx + 1].text.match(/^\$\d+(,\d+)*\.\d+$/)) {
                break
              }

              account.name = processed[cellIdx].text.replace('\n', ' ')
              account.startingBalance = parseFloat(processed[cellIdx + 1].text.replace('$', '').replace(',', ''))
              account.endingBalance = parseFloat(processed[cellIdx + 5].text.replace('$', '').replace(',', ''))
              account.cashflow = parseFloat(processed[cellIdx + 2].text.replace('$', '').replace(',', '').replace(' ', ''))

              accounts.push(account)

              cellIdx += 6
            }

            processedIdx = cellIdx
          }

          // Find Transactions
          if (item.text.startsWith('TRANSACTIONS /')
            && processed[idx + 2].text === 'Date'
            && processed[idx + 7].text === 'Total Value'
          ) {
            isProcessingTransactions = true
            txnsAccountName = processed[idx + 1].text
            txnsAccountIdx = accounts.findIndex(acc => acc.name === txnsAccountName)
            if (txnsAccountIdx < 0) return console.warn(`Cannot find account: ${txnsAccountName}`)
            processedIdx = idx + 11
            return
          }

          if (item.text.startsWith('FEE CALCULATIONS /')) {
            hasReachedFeeCalculations = true
            stop = true
            return
          }

          // Transactions
          if (isProcessingTransactions
            && !hasReachedFeeCalculations
            && processed[idx].text.match(/^\d{2} \w{3} \d{4}$/)
            && processed[idx + 1].text
            && processed[idx + 5]
            && processed[idx + 5].text.match(/^(\-|-?\$\d+(,\d+)*\.\d{2})$/)) {

            const dateStr = processed[idx].text
            const desc = processed[idx + 1].text.replace('\n', ' ')
            const amt = processed[idx + 5].text

            if (desc.match(/^Deposit|Withdrawal$/)) {
              accounts[txnsAccountIdx].transactions.push({
                description: desc,
                date: dayjs(dateStr, 'DD MMM YYYY').format('YYYY-MM-DD'),
                amount: parseFloat(amt.replace('$', '').replace(',', ''))
              })
            }

            processedIdx = idx + 5
            return
          }

          if (!statementDate) return

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
          type: 'stashaway',
          assetType: 'invest',
          accounts
        }
        return statementData
      })
      .catch(err => console.error('error:', err))
  }

}
