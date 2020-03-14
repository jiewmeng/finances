import React from 'react'
import { Row, Col, Button, Typography, Table, Card, Icon } from 'antd'
import PageHeader from 'ant-design-pro/lib/PageHeader'
import DescriptionList from 'ant-design-pro/lib/DescriptionList'
import NumberInfo from 'ant-design-pro/lib/NumberInfo'
import { ChartCard, MiniArea } from 'ant-design-pro/lib/Charts'
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { DateTime } from 'luxon'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { config } from '../../config'

export default class DashboardPage extends React.Component {
  constructor(params) {
    super(params)

    this.state = {
      isInitialized: false,
      isGettingStatements: false
    }
  }

  componentDidMount() {
    this.getStatements()
  }

  componentDidUpdate() {
    this.getStatements()
  }

  getStatements = async () => {
    const token = this.props.auth.idToken
    if (token && !this.state.isInitialized) {
      this.setState({ isGettingStatements: true })
      const statements = axios.get(`${config.API_URL}/statements`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      this.setState({ isGettingStatements: false, isInitialized: true })
      console.log(statements)
    }
  }

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

    const assetData = [
      {
        date: '2018-10',
        dbsBank: 59000,
        uobBank: 12000,
        stashaway: 7000,
        poems: 26000
      },
      {
        date: '2018-11',
        dbsBank: 57000,
        uobBank: 11500,
        stashaway: 8500,
        poems: 26000
      },
      {
        date: '2018-12',
        dbsBank: 59000,
        uobBank: 12000,
        stashaway: 9600,
        poems: 26000
      },
      {
        date: '2019-01',
        dbsBank: 61000,
        uobBank: 10000,
        stashaway: 10000,
        poems:30000
      },
      {
        date: '2019-02',
        dbsBank: 63000,
        uobBank: 9000,
        stashaway: 12000,
        poems: 35000
      },
      {
        date: '2019-03',
        dbsBank: 65000,
        uobBank: 7000,
        stashaway: 15000,
        poems: 36000
      },
    ]

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
              <ChartCard title="Investments" total="60,000.00">
                <MiniArea line height={60} data={investments}></MiniArea>
              </ChartCard>
            </Col>
            <Col span={8}>
              <ChartCard title="Credit Card" total="600.00">
                <MiniArea line height={60} data={creditCardSpending}></MiniArea>
              </ChartCard>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Card title="Assets (Bank + Investments)">
                <ResponsiveContainer width="100%" height={360}>
                  <AreaChart data={assetData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <CartesianGrid strokeDasharray="3 3"/>
                    <Area stackId="a" type="monotone" name="DBS" dataKey="dbsBank" stroke="#FF1744" fill="#FF1744" strokeWidth={2} />
                    <Area stackId="a" type="monotone" name="UOB" dataKey="uobBank" stroke="#3D5AFE" fill="#3D5AFE" strokeWidth={2} />
                    <Area stackId="a" type="monotone" name="StashAway" dataKey="stashaway" stroke="#00E676" fill="#00E676" strokeWidth={2} />
                    <Area stackId="a" type="monotone" name="POEMS" dataKey="poems" stroke="#00B0FF" fill="#00B0FF" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
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
              <Card title="Recent Statements Uploaded" extra={<Button type="primary"><Link to="/statement/upload"><Icon type="cloud-upload" /> Upload</Link></Button>}>
                <Table bordered size="middle" columns={tableColumns} dataSource={tableData} />
              </Card>
            </Col>
          </Row>
        </div>
      </React.Fragment>
    )
  }
}
