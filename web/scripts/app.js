import 'app/css/normalize.css'
import 'app/css/app.css'

import React from 'react'
import ReactDOM from 'react-dom'

const App = () => {
  return (
    <div>
      <h1>Finances</h1>
    </div>
  )
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
)
