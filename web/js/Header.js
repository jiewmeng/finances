import React from 'react'
import { Layout, Menu, Icon, Avatar, Button } from 'antd'
import AppContext from './AppContext'
import { Link } from 'react-router-dom'
import * as firebase from 'firebase/app'
import 'firebase/auth'

export default class Header extends React.Component {
  logout = () => {
    firebase.auth().signOut()
  }

  render() {
    return (
      <AppContext.Consumer>
        {({auth}) => {
          const isLoggedIn = Boolean(auth.idToken)

          const menu = isLoggedIn ? (
            <Menu theme="dark" mode="horizontal" style={{ lineHeight: '64px' }}>
              <Menu.Item><Link to="/"><Icon type="line-chart" />Dashboard</Link></Menu.Item>
              <Menu.Item><Link to="/bank"><Icon type="bank" />Bank</Link></Menu.Item>
              <Menu.Item><Link to="/invest"><Icon type="dollar" />Invest</Link></Menu.Item>
              <Menu.Item><Link to="/credit-card"><Icon type="credit-card" />Credit Card</Link></Menu.Item>

              <Menu.SubMenu style={{ float: 'right' }} title={(
                <Avatar src={auth.displayPic}></Avatar>
              )}>
                <Menu.Item onClick={this.logout}>Logout</Menu.Item>
              </Menu.SubMenu>
              <Menu.Item style={{float: 'right'}}>
                <Icon type="cloud-upload" />
                Upload Statement
              </Menu.Item>
            </Menu>
          ) : null

          return (
            <Layout.Header>
              <h1 className="site-name">Finances</h1>
              {menu}
            </Layout.Header>
          )
        }}
      </AppContext.Consumer>
    )
  }
}
