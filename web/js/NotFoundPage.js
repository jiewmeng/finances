import React from 'react'
import { Button } from 'antd'
import Exception from 'ant-design-pro/lib/Exception'

export default class NotFoundPage extends React.Component {
  render() {
    return (
      <Exception type="404" desc="You seem lost in space" backText="Go back home"></Exception>
    )
  }
}
