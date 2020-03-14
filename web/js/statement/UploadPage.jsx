import React, { Component, useContext } from 'react'
import { Row, Col, Card, Typography, Upload, Icon, Table } from 'antd'
import AppContext from '../AppContext'
import axios from 'axios'
import { DateTime } from 'luxon'
import { config } from '../../config'


export default class UploadPage extends Component {
  constructor(params) {
    super(params)

    this.state = {
      isGettingStatements: false,
      isInitialized: false,
      statements: []
    }
  }

  componentDidMount() {
    this.getRecentlyUploaded(this.props.auth.auth.idToken)
  }

  componentDidUpdate() {
    this.getRecentlyUploaded(this.props.auth.auth.idToken)
  }

  async getRecentlyUploaded(token, refresh = false) {
    if (token && (refresh || (!this.state.isInitialized && !this.state.isGettingStatements))) {
      this.setState({ isGettingStatements: true })
      const res = await axios.get(`${config.API_URL}/statements/recent`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      this.setState({
        statements: res.data.data,
        isInitialized: true,
        isGettingStatements: false
      })
    }
  }

  render() {
    const recentStatementColumns = [
      {
        title: 'Statement',
        key: 'statementId',
        dataIndex: 'statementId',
        render: text => <span>{text}</span>
      },
      {
        title: 'Status',
        key: 'status',
        dataIndex: 'status',
        render: text => <span>{text}</span>
      },
      {
        title: 'Uploaded On',
        key: 'uploadedOn',
        dataIndex: 'uploadedOn',
        render: text => <span>{DateTime.fromISO(text).toFormat('d MMM yyyy H:mm a')}</span>
      },
    ]

    const recentStatementData = this.state.statements

    return (
      <AppContext.Consumer>
        {({ auth }) => {
          return (
            <div className="content-wrapper">
              <Row gutter={16}>
                <Col span={24}>
                  <Card>
                    <Typography.Title level={4}>Upload Statement</Typography.Title>

                    <Upload.Dragger
                      name="files"
                      action={`${config.API_URL}/statements`}
                      headers={{ Authorization: `Bearer ${auth.idToken}` }}
                      multiple
                      onChange={(evt) => {
                        if (evt.fileList && evt.fileList[0].status === 'done') {
                          this.getRecentlyUploaded(auth.idToken, true)
                        }
                      }}>
                      <p className="ant-upload-drag-icon">
                        <Icon type="inbox" />
                      </p>
                      <p className="ant-upload-text">Click or drag file to this area to upload</p>
                      <p className="ant-upload-hint">
                        Select statements to upload. Should be PDF named <code>dbs|uob-YYYY-MM.pdf</code>, eg. <code>dbs-2019-06.pdf</code>
                      </p>
                    </Upload.Dragger>
                  </Card>
                </Col>
              </Row>

              <Row>
                <Col>
                  <Card title="Recently uploaded">
                    <Table
                      bordered
                      size="middle"
                      rowKey="statementId"
                      loading={this.state.isGettingStatements}
                      columns={recentStatementColumns}
                      dataSource={recentStatementData} />
                  </Card>
                </Col>
              </Row>
            </div>
          )
        }}
      </AppContext.Consumer>
    )
  }
}

// UploadPage.contextType = AppContext
