# Finances Server

## Tech Stack

NodeJS 10 on AWS

- NodeJS 10
- Lambda
- DynamoDB
- API Gateway
- Google Login
- Terraform

## Getting Started

##### Starting development server

```
npm run dev
```

##### Deploy

```
NODE_ENV=XXX npm run deploy
```

Replace `XXX` with whatever environment

## Architecture






------

Transaction

- user
- id
- accountName: bank account/credit card
- amount: for expenses -ve, otherwise +ve
- associatedTxn: link to other transaction, eg. in a bank transfer/credit card payment. In net worth report, dont count the CC txn. Only count the payment transaction. In expenses report, count the CC txn, dont count the payment txn. In transfers, can count as normal since it should "normalize"
- associationType: payment/transfer
- balance: balance for the current account after this transaction
- category
- date
- description
- statement

Statement

- user
- yearMonth
- type (dbs/uob/dbsCredit/)
- assetType (bank/credit/invest)

- accounts
  + startingBalance
  + endingBalance
  + totalWithdrawals
  + totalDeposits
  + netDeposits (for investments only)
  + returns (for investments only)
  + name
<!-- - startDate
- endDate -->
- status
- uploadedOn
- filepath
- activityLog
  + date
  + description
