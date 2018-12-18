# Finances 2019

## Goals

Parse Bank & Investment PDF statements from DBS, UOB, POEMS, StashAway, Standard Chartered into DataStore to give insights like expenses by expenses, assets based on category, day/week/month. 

Reduce costs by exploring Serverless options like Firestore, CloudFunctions & AppEngine.

For initial implementation, we skip category and edits. The focus will be on assets (deposits, withdrawals, current asset value and performance) only.

## Some challenges

### NoSQL & Aggregations

Since NoSQL Firestore is not suited for aggregation workloads, the alternative is: 

- When a statement is uploaded
    - Generate UUID pending commit ID
    - Insert transaction records with pending commit ID
    - Insert pendingCommit record with ready=false

- When pendingCommit update is detected, if ready=true
    - Get transactions with pending commit ID, compute their daily aggregations
    - Once done, delete pendingCommit record

- (Maybe next time ...) When a transaction is updated/deleted, recompute aggregations for the day

- To get aggregation for week/month, we need to get day aggregation for those days ... (should be ok since max records per year is only 365)

## Data Structure

- user
    - {userId}
        - transactions
            - {transactionId}
                - type : ENUM(BANK|INVEST|CREDIT)
                - account : STRING eg. DBS X-XXXXXX-X
                - statementYearMonth : INT (in format YYYYMM)
                - statementOrder: INT
                - transactionDate : TIMESTAMP
                - description : STRING
                - ticker : STRING (INVEST only)
                - units : INT (INVEST only)
                - unitPrice : FLOAT (INVEST only)
                - assetCurrValue : FLOAT (INVEST only) 
                - category : CATEGORY_ID
                - pendingCommit: PENDING_UPDATE_ID
        - assets
            - {YYYYMM}
                - {ACCOUNT} : FLOAT
                - {ASSET|TICKER}
                    - BalanceOfDeposits (Deposits - Withdrawals)
                    - Units
                    - AssetValue
                    - Performance (%)
        - pendingUpdates
            - {id}
                - ready : BOOLEAN
        - categories
            - ALL
                - "ALL"
            - {id}
                - STRING

## CloudStorage

- user
    - {userId}
        - DBSBank
        - UOBBank
        - POEMS
        - StashAway
        - CPF
        - CDP
        - DBSCard
        - UOBCard
        - SCCard



# TODOs

[X] #SetupUI Should compile React files
[X] #SetupUI Should compile CSS Next files
[X] #SetupUI Should have hot reload
[ ] #SetupUI Should copy assets
[ ] #SetupUI Should lint code
[X] #SetupUI Should be able to deploy to Firebase Hosting
[ ] #SetupServer Should be able to deploy to Cloud Functions
[ ] #SetupServer Should be able to deploy to AppEngine
[ ] #UI Should be able to login with Google account
[ ] #DatastoreRules Should validate login is within whitelisted accounts only (https://goo.gl/mBxDBp)
[ ] #UI Should be able to upload statement to cloud storage
[ ] #DatastoreRules Should validate authenticated user can only upload to specified folder
[ ] #DatastoreTrigger Should trigger when DBS bank statement is uploaded. To parse and get balances.
[ ] #UI Should be able to list assets 
[ ] #DatastoreTrigger Should trigger when UOB bank statement is uploaded. To parse and get balances. 
[ ] #DatastoreTrigger Should trigger when POEMS statement is uploaded. To parse and get balances. 
[ ] #DatastoreTrigger Should trigger when StashAway statement is uploaded. To parse and get balances. 
[ ] #DatastoreTrigger Should trigger when CDP statement is uploaded. To parse and get balances. 
[ ] #DatastoreTrigger Should trigger when CPF statement is uploaded. To parse and get balances. 
[ ] #UI Should be able to chart assets by month
[ ] #DatastoreTrigger Extend to extract transactions for DBS Bank
[ ] #DatastoreTrigger Extend to extract transactions for UOB Bank
[ ] #DatastoreTrigger Extend to extract transactions for StashAway
[ ] #DatastoreTrigger Extend to extract transactions for CDP
[ ] #DatastoreTrigger Extend to extract transactions for CPF
[ ] #DatastoreTrigger Extend to parse transactions from DBS credit card statement
[ ] #DatastoreTrigger Extend to parse transactions from UOB credit card statement
[ ] #DatastoreTrigger Extend to parse transactions from SC credit card statement
[ ] #UI Should be able to list transactions
[ ] #UI Should be able to chart expenses by month