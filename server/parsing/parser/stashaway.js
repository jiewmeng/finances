const pdf = require('pdf-parse')
const dayjs = require('dayjs')
const pdfOpts = {
  normalizeWhitespace: false,
  disableCombineTextItems: false
}

module.exports = class StashawayParser {
  async parse(buf) {
    const accounts = {}
    let statementDate
    let statementYear
    let cardName
    let cardPrevBalance

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

          if (Math.abs(prevItem.x - currItem.x) < 2 && Math.abs(currItem.y + currItem.h - prevItem.y) < 5) {
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
        processed = processedMergedY

        let foundHeader = false
        let processedIdx = 0
        let stop = false
        processed.forEach((item, idx) => {
          if (stop) return

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

          if (!statementDate) return

          return
        })
        // console.log(JSON.stringify(processed, null, 2))
        console.log(statementDate.format('MMM YYYY'))
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
          accounts: Object.values(accounts)
        }
        return statementData
      })
      .catch(err => console.error('error:', err))
  }

}
