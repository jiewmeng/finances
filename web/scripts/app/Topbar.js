import React from 'react'
import { Link } from 'react-router-dom'

export default function Topbar() {
  return (
    <div className="topbar">
      <h1 className="topbar-appname">Finances</h1>

      <nav class="topbar-nav">
        <Link to="/statements/upload"><i className="material-icons">cloud_upload</i></Link>
        <Link to="/transactions"><i className="material-icons">view_list</i></Link>
      </nav>
    </div>
  )
}
