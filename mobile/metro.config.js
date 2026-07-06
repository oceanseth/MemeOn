// Allow importing the repo-level shared/ module (tier definitions) from the app.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)
config.watchFolders = [path.resolve(__dirname, '..', 'shared')]

module.exports = config
