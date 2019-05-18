const defaultConfig = require('./default')

const NODE_ENV = process.env.NODE_ENV
let envConfig
let localConfig

if (NODE_ENV) {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    envConfig = require(`./${NODE_ENV}`)
  } catch (e) {
    // noop
  }
}

try {
  // eslint-disable-next-line global-require, import/no-unresolved
  localConfig = require('./local')
} catch (e) {
  // noop
}

const config = {
  ...defaultConfig,
  ...envConfig,
  ...localConfig
}

const initConfig = function() {
  Object.keys(config).forEach((k) => {
    config[k] = JSON.stringify(config[k])
  })
  return config
}

module.exports = {
  config,
  initConfig
}
