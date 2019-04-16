import React from 'react'
import { Layout, Menu, Icon } from 'antd'
import AppContext from './AppContext'

const { Header } = Layout

export default () => {
  return (
    <AppContext.Consumer>
      {({auth}) => {
        console.log(auth)
        const isLoggedIn = Boolean(auth.idToken)

        const menu = isLoggedIn ? (
          <Menu theme="dark" mode="horizontal" style={{ lineHeight: '64px' }}>
            <Menu.Item><Icon type="line-chart" />Dashboard</Menu.Item>
            <Menu.Item><Icon type="bank" />Bank</Menu.Item>
            <Menu.Item><Icon type="dollar" />Invest</Menu.Item>
            <Menu.Item><Icon type="credit-card" />Credit Card</Menu.Item>
          </Menu>
        ) : null

        return (
          <Header>
            <h1 className="site-name">Finances</h1>
            {menu}
          </Header>
        )
      }}
    </AppContext.Consumer>
  )
}
