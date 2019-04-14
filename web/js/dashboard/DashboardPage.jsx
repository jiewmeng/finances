import React from 'react'
import { Row, Col, Button, Typography, Table, Card, Icon } from 'antd'
import PageHeader from 'ant-design-pro/lib/PageHeader'
import DescriptionList from 'ant-design-pro/lib/DescriptionList'
import NumberInfo from 'ant-design-pro/lib/NumberInfo'
import { ChartCard, MiniArea, TimelineChart } from 'ant-design-pro/lib/Charts'

export default class DashboardPage extends React.Component {
  render() {
    const bankBalances = []
    const creditCardSpending = []
    const investments = []
    for (let i = 0; i < 30; i++) {
      bankBalances.push({
        x: i,
        y: (Math.random() * 100) + 20
      })
      creditCardSpending.push({
        x: i,
        y: (Math.random() * 100) + 20
      })
      investments.push({
        x: i,
        y: (Math.random() * 100) + 20
      })
    }

    const tableColumns = [
      {
        title: 'Statement Date',
        key: 'statementDate',
        dataIndex: 'statementDate',
        render: text => <span>{text}</span>
      },
      {
        title: 'Bank',
        children: [
          {
            title: 'DBS',
            key: 'dbsBank',
            dataIndex: 'dbsBank',
            render: text => text ? <Icon type="check-circle" /> : null,
            align: 'center'
          },
          {
            title: 'UOB',
            key: 'uobBank',
            dataIndex: 'uobBank',
            render: text => text ? <Icon type="check-circle" /> : null,
            align: 'center'
          },
        ]
      },
      {
        title: 'Credit Card',
        children: [
          {
            title: 'DBS',
            key: 'dbsCredit',
            dataIndex: 'dbsCredit',
            render: text => text ? <Icon type="check-circle" /> : null,
            align: 'center'
          },
          {
            title: 'UOB',
            key: 'uobCredit',
            dataIndex: 'uobCredit',
            render: text => text ? <Icon type="check-circle" /> : null,
            align: 'center'
          },
          {
            title: 'CIMB',
            key: 'cimbCredit',
            dataIndex: 'cimbCredit',
            render: text => text ? <Icon type="check-circle" /> : null,
            align: 'center'
          },
        ]
      },
      {
        title: 'Investments',
        children: [
          {
            title: 'StashAway',
            key: 'stashaway',
            dataIndex: 'stashaway',
            render: text => text ? <Icon type="check-circle" /> : null,
            align: 'center'
          },
          {
            title: 'POEMS',
            key: 'poems',
            dataIndex: 'poems',
            render: text => text ? <Icon type="check-circle" /> : null,
            align: 'center'
          },
          {
            title: 'POSB Invest Saver',
            key: 'posbInvestSaver',
            dataIndex: 'posbInvestSaver',
            render: text => text ? <Icon type="check-circle" /> : null,
            align: 'center'
          },
          {
            title: 'CDP',
            key: 'cdp',
            dataIndex: 'cdp',
            render: text => text ? <Icon type="check-circle" /> : null,
            align: 'center'
          },
          {
            title: 'CPF',
            key: 'cpf',
            dataIndex: 'cpf',
            render: text => text ? <Icon type="check-circle" /> : null,
            align: 'center'
          },
        ]
      },
    ]

    const tableData = [
      {
        statementDate: '2019-04',
        dbsBank: true,
        uobBank: true,
        dbsCredit: true,
        uobCredit: true,
        cimbCredit: true,
        stashaway: true,
        poems: false,
        posbInvestSaver: false,
        cdp: false,
        cpf: false,
      },
      {
        statementDate: '2019-03',
        dbsBank: true,
        uobBank: true,
        dbsCredit: true,
        uobCredit: false,
        cimbCredit: true,
        stashaway: true,
        poems: false,
        posbInvestSaver: false,
        cdp: false,
        cpf: false,
      },
      {
        statementDate: '2019-02',
        dbsBank: true,
        uobBank: true,
        dbsCredit: true,
        uobCredit: true,
        cimbCredit: true,
        stashaway: true,
        poems: false,
        posbInvestSaver: false,
        cdp: true,
        cpf: false,
      },
      {
        statementDate: '2019-01',
        dbsBank: true,
        uobBank: true,
        dbsCredit: true,
        uobCredit: true,
        cimbCredit: true,
        stashaway: true,
        poems: false,
        posbInvestSaver: false,
        cdp: false,
        cpf: true,
      },
    ]

    const txnTblColumns = [
      {
        title: 'Date',
        key: 'date',
        dataIndex: 'date',
        render: text => <span>{text}</span>
      },
      {
        title: 'Category',
        key: 'category',
        dataIndex: 'category',
        render: text => <span>{text}</span>
      },
      {
        title: 'Description',
        key: 'description',
        dataIndex: 'description',
        render: text => <span>{text}</span>
      },
      {
        title: 'Amount',
        key: 'amount',
        dataIndex: 'amount',
        render: text => <span>{text}</span>
      },
      {
        title: 'Statement',
        key: 'statement',
        dataIndex: 'statement',
        render: text => <span>{text}</span>
      },
    ]

    const txnTblData = [
      {
        date: '2018-12-05',
        statement: 'DBS Bank 2018-11',
        description: 'NTUC Fairprice',
        category: 'Groceries',
        amount: 25.80
      },
      {
        date: '2018-12-05',
        statement: 'DBS Bank 2018-11',
        description: 'Royal Sporting House',
        category: 'Clothes',
        amount: 25.80
      },
      {
        date: '2018-12-07',
        statement: 'DBS Bank 2018-11',
        description: 'Food',
        category: 'Food',
        amount: 25.80
      },
      {
        date: '2018-12-08',
        statement: 'DBS Bank 2018-11',
        description: 'Something else',
        category: 'Others',
        amount: 25.80
      },
      {
        date: '2018-12-09',
        statement: 'DBS Bank 2018-11',
        description: 'NTUC Fairprice',
        category: 'Groceries',
        amount: 25.80
      },
    ]

    const assetsData = [
      {
        x: '2018-11',
        y1: '50000.50',
        y2: '10000.00',
        y3: '8000.00',
        y4: '36600.00',
        y5: '200.00',
        y6: '1000.00',
        y7: '20000.00',
      },
      {
        x: '2018-12',
        y1: '51000.50',
        y2: '10500.00',
        y3: '8100.00',
        y4: '36800.00',
        y5: '300.00',
        y6: '1200.00',
        y7: '20100.00',
      },
      {
        x: '2019-01',
        y1: '50000.50',
        y2: '10000.00',
        y3: '8000.00',
        y4: '36600.00',
        y5: '200.00',
        y6: '1000.00',
        y7: '20000.00',
      },
      {
        x: '2019-02',
        y1: '52000.50',
        y2: '12000.00',
        y3: '8000.00',
        y4: '36600.00',
        y5: '200.00',
        y6: '1000.00',
        y7: '21000.00',
      },
      {
        x: '2019-03',
        y1: '53000.50',
        y2: '13000.00',
        y3: '8200.00',
        y4: '36800.00',
        y5: '500.00',
        y6: '1200.00',
        y7: '24000.00',
      },
    ]

    const assetMap = {
      y1: 'DBS Bank',
      y2: 'UOB Bank',
      y3: 'StashAway',
      y4: 'POEMS',
      y5: 'POSB Invest Saver',
      y6: 'CDP',
      y7: 'CPF',
    }

    return (
      <React.Fragment>
        <div className="content-wrapper">
          <Row gutter={16}>
            <Col span={8}>
              <ChartCard title="Bank Balance" total="72,000.00">
                <MiniArea line height={60} data={bankBalances}></MiniArea>
              </ChartCard>
            </Col>
            <Col span={8}>
            <ChartCard title="Credit Card" total="600.00">
                <MiniArea line height={60} data={creditCardSpending}></MiniArea>
              </ChartCard>
            </Col>
            <Col span={8}>
            <ChartCard title="Investments" total="60,000.00">
                <MiniArea line height={60} data={investments}></MiniArea>
              </ChartCard>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Card title="Assets (Bank + Investments)">
                <TimelineChart height={360} data={assetsData} titleMap={assetMap} />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Card title="Recent Transactions">
                <Table bordered size="middle" columns={txnTblColumns} dataSource={txnTblData} />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Card title="Recent Statements Uploaded" extra={<Button type="primary"><Icon type="cloud-upload" />Upload</Button>}>
                <Table bordered size="middle" columns={tableColumns} dataSource={tableData} />
              </Card>
            </Col>
          </Row>
        </div>
      </React.Fragment>
    )
  }
}
