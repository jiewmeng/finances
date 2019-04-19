import React from 'react'
import { Row, Col, Card, Table, DatePicker, Select, Form, Radio, Icon, Button, Drawer } from 'antd'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'

const { MonthPicker } = DatePicker
const { Option } = Select

export default class BankPage extends React.Component {
  constructor(params) {
    super(params)

    this.state = {
      isFilterVisible: false
    }
  }

  toggleFilter = () => {
    this.setState({
      isFilterVisible: !this.state.isFilterVisible
    })
  }

  onFilterClose = () => {
    this.setState({
      isFilterVisible: false
    })
  }

  render() {
    const data = [
      {
        date: '2018-10',
        dbsBank: 59000,
        uobBank: 12000,
      },
      {
        date: '2018-11',
        dbsBank: 57000,
        uobBank: 11500,
      },
      {
        date: '2018-12',
        dbsBank: 59000,
        uobBank: 12000,
      },
      {
        date: '2019-01',
        dbsBank: 61000,
        uobBank: 10000,
      },
      {
        date: '2019-02',
        dbsBank: 63000,
        uobBank: 9000,
      },
      {
        date: '2019-03',
        dbsBank: 65000,
        uobBank: 7000,
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

    return (
      <React.Fragment>
        <div className="content-wrapper">
          <Row gutter={16}>
            <Col span={24}>
              <Card title="Bank Balances" extra={(
                <Form layout="inline">
                  <Form.Item>
                    <Radio.Group>
                      <Radio.Button value="line">
                        <Icon type="line-chart" />
                      </Radio.Button>
                      <Radio.Button value="stacked">
                        <Icon type="bar-chart" />
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item>
                    <Button onClick={this.toggleFilter}>
                      <Icon type="filter" />
                    </Button>
                  </Form.Item>
                </Form>
              )}>

                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={data}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <CartesianGrid strokeDasharray="3 3"/>
                    <Line type="monotone" name="DBS" dataKey="dbsBank" stroke="#a8071a" strokeWidth={2} />
                    <Line type="monotone" name="UOB" dataKey="uobBank" stroke="#0050b3" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Card title="Transactions">
               <Table bordered size="middle" columns={txnTblColumns} dataSource={txnTblData} />
              </Card>
            </Col>
          </Row>
        </div>

        <Drawer title="Filter" placement="right" closable visible={this.state.isFilterVisible} width={360} onClose={this.onFilterClose}>
          <Form>
            <Form.Item label="Month">
              <MonthPicker placeholder="Select month" style={{ display: 'block' }} />
            </Form.Item>
            <Form.Item label="Bank">
              <Select defaultValue="">
                <Option value="">Any bank</Option>
                <Option value="dbs">DBS</Option>
                <Option value="uob">UOB</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button block>
                <Icon type="reload" />
                Clear Filter
              </Button>
            </Form.Item>
          </Form>
        </Drawer>
      </React.Fragment>
    )
  }
}
