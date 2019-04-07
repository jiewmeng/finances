import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Redirect, Link, Switch } from 'react-router-dom'
import { Layout, Menu, Icon } from 'antd'

const { Header, Content, Footer } = Layout

import 'antd/dist/antd.css'
import 'ant-design-pro/dist/ant-design-pro.css'
import '../css/site.css'
import NotFoundPage from './NotFoundPage'

class App extends React.Component {
  render() {
    return (
      <Layout>
        <Header>
          <h1 className="site-name">Finances</h1>
          <Menu theme="dark" mode="horizontal" style={{ lineHeight: '64px' }}>
            <Menu.Item><Icon type="line-chart" />Dashboard</Menu.Item>
            <Menu.Item><Icon type="table" />Transactions</Menu.Item>
            <Menu.Item><Icon type="file" />Statements</Menu.Item>
          </Menu>
        </Header>

        <Content style={{ padding: '0 50px' }}>
          <Router>
            <Switch>
              <Route component={NotFoundPage} />
            </Switch>
          </Router>
        </Content>

        <Footer>&copy; Finances 2019</Footer>
      </Layout>
    )
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
)
