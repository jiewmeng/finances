import 'app/css/normalize.css'
import 'app/css/app.css'

import React from 'react'
import ReactDOM from 'react-dom'

const App = () => {
  return (
    <div>
      <h1>Finances</h1>
      <a href="/test.txt" target="_blank">Test</a>
    </div>
  )
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
)
