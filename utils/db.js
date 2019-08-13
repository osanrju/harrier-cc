
var redis = require('async-redis')

let client

module.exports = () => {
  return {
    getDb: async () => {
      // reuse existing DB connection
      if (client === undefined) {
        client = await redis.createClient()
      }
      return client
    },

    closeDB: async () => {
      if (client !== undefined) {
        await client.quit()
        return true
      }

      return false
    },

    testSet: async () => {
      if (client !== undefined) {
        const resp = await client.set('testKey', 'testValue')
        return resp
      }
    },

    testGet: async () => {
      if (client !== undefined) {
        const resp = await client.get('testKey')
        return resp
      }
    }
  }
}
