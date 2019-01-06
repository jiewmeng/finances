import React from 'react'
import { Route, Redirect } from 'react-router'
import AppContext from 'app/scripts/AppContext'

export default class AuthenticatedRoute extends React.Component {
  render() {
    return (
      <AppContext.Consumer>
        {({ uid }) => {
          const isLoggedIn = Boolean(uid)
          if (!isLoggedIn) {
            return <Redirect to={{ pathname: '/auth/login', state: { redirectUrl: this.props.location.pathname } }} />
          }

          return <Route {...this.props} />
        }}
      </AppContext.Consumer>
    )

  }
}
