
const dbUtils = require('../utils/db')
const errHandler = require('../utils/errorHandler')

let client

const db = dbUtils()

db.getDb().then(dbclient => {
  client = dbclient
  client.on('error', err => {
    errHandler(err)
  })
})

module.exports = () => {
  async function isTableValid (restaurantId, tableId) {
    var validRestaurantId = await client.hget('table:' + tableId, 'restaurant')

    // eslint-disable-next-line eqeqeq
    if (restaurantId == validRestaurantId) {
      return true
    }
    return false
  }

  async function isInQuota (restaurantId, waiterId, maxTables) {
    var currentAssignmentCount = await client.scard('restaurant:' + restaurantId + ':waiter:' + waiterId)

    if (currentAssignmentCount >= maxTables) {
      return false
    }
    return true
  }

  async function isRestaurantValid (restaurantId) {
    if (await client.hget('restaurant:' + restaurantId, 'Name')) {
      return true
    }

    return false
  }

  async function isWaiterValid (waiterId) {
    if (await client.hget('waiter:' + waiterId, 'Name')) {
      return true
    }
    return false
  }

  async function isTableAssignedAlready (restaurantId, tableId) {
    if (await client.hget('table:' + tableId, 'waiter')) {
      return true
    }
    return false
  }

  async function getWaiterswithinQuota (restaurantId, waiterId, maxRule) {
    var waiters = await client.smembers('waiters')
    var result = []

    for (const waiter of waiters) {
      if (waiter !== waiterId && await isInQuota(restaurantId, waiter, maxRule)) {
        result.push({
          id: waiter,
          name: await client.hget('waiter:' + waiter, 'Name'),
          currentAssignment: await client.scard('restaurant:' + restaurantId + ':waiter:' + waiter)
        })
      }
    }
    return result
  }

  return {
    /** ***** manager api helpers *****************/
    getRestaurants: async () => {
      var restaurants = await client.smembers('restaurants')

      const response = []
      for (let index = 0; index < restaurants.length; index++) {
        response.push({ id: restaurants[index], name: await client.hget('restaurant:' + restaurants[index], 'Name') })
      }

      return response
    },

    getTables: async (restaurantId) => {
      var restaurantDetails = await client.hgetall('restaurant:' + restaurantId)
      const result = {}
      var id, waiter, waiterid

      if (restaurantDetails) {
        var tables = await client.smembers('tables:' + restaurantDetails.tables)
        result['tables'] = []

        for (let index = 0; index < tables.length; index++) {
          id = tables[index]
          waiterid = await client.hget('table:' + tables[index], 'waiter')
          waiter = await client.hget('waiter:' + waiterid, 'Name')
          result['tables'].push({ id: id, waiterid: waiterid, waiter: waiter })
        }

        result['restaurant'] = { id: '' + restaurantId, name: restaurantDetails.Name }

        return result
      } else {
        return { error: 'No restaurant found with the name!' }
      }
    },

    getWaiters: async (restaurantId) => {
      if (!await isRestaurantValid(restaurantId)) {
        return { error: 'Not a valid restaurant' }
      }

      var waiters = await client.smembers('waiters')
      const waiterStatus = []
      for (const waiter of waiters) {
        waiterStatus.push({
          waiter: {
            id: waiter,
            name: await client.hget('waiter:' + waiter, 'Name'),
            allocation: await client.smembers('restaurant:' + restaurantId + ':waiter:' + waiter)
          } })
      }
      return waiterStatus
    },

    assignTable: async (restaurantId, tableId, waiterId) => {
      // check for the assignment rule
      var maxTables = await client.get('ruleTables')
      var tableName

      // sanity checks
      if (!await isRestaurantValid(restaurantId)) {
        return { error: 'Not a valid restaurant' }
      }

      if (!await isTableValid(restaurantId, tableId)) {
        return { error: 'Not a valid Table' }
      }

      if (!await isWaiterValid(waiterId)) {
        return { error: 'Unknown waiter' }
      }

      if (await isTableAssignedAlready(restaurantId, tableId)) {
        return { error: 'Table already assigned' }
      }

      if (!await isInQuota(restaurantId, waiterId, maxTables)) {
        var availableWaiters = await getWaiterswithinQuota(restaurantId, waiterId, maxTables)

        return { error: 'Assignment is over the quota', availableWaiters }
      }

      await client.sadd('restaurant:' + restaurantId + ':waiter:' + waiterId, tableId)
      tableName = await client.hget('table:' + tableId, 'Name')
      await client.hset('table:' + tableId, 'waiter', waiterId)
      await client.rpush('waiter:' + waiterId + ':messages', tableName + ' has been assigned')
      return { msg: 'Table has been assigned' }
    },

    clearTable: async (restaurantId, tableId) => {
      var waiterId
      var tableName

      if (!await isTableValid(restaurantId, tableId)) {
        return { error: 'Not a valid Table' }
      }
      if (!await isTableAssignedAlready(restaurantId, tableId)) {
        return { error: 'No Waiter is assigned to the table' }
      }

      waiterId = await client.hget('table:' + tableId, 'waiter')
      tableName = await client.hget('table:' + tableId, 'Name')
      await client.hdel('table:' + tableId, 'waiter')
      await client.srem('restaurant:' + restaurantId + ':waiter:' + waiterId, tableId)
      await client.rpush('waiter:' + waiterId + ':messages', '' + tableName + ' has been removed')
      return { msg: tableName + ' has been cleared' }
    },
    /** ******************************************/

    /** ***** waiter api helpers *****************/
    getAssignments: async (waiterId, restaurants) => {
      var tables, tableName
      var tablesAssigned = []
      var response = {}
      response.restaurantDetails = []

      if (!await isWaiterValid(waiterId)) {
        return {
          error: 'Unknown Waiter'
        }
      }

      for (const index in restaurants) {
        tables = await client.smembers('restaurant:' + restaurants[index].id + ':waiter:' + waiterId)
        tablesAssigned = []
        for (var tabIndex in tables) {
          tableName = await client.hget('table:' + tables[tabIndex], 'Name')
          tablesAssigned.push(tableName)
        }
        response.restaurantDetails.push({
          id: restaurants[index].id,
          Name: restaurants[index].name,
          tablesAssigned: tablesAssigned
        })
      }
      var msgList = await client.lrange('waiter:' + waiterId + ':messages', 0, -1)

      response.waiter = {
        id: waiterId,
        name: await client.hget('waiter:' + waiterId, 'Name'),
        messages: msgList
      }

      client.del('waiter:' + waiterId + ':messages')
      return response
    },

    /** ******************************************/

    /** ***** admin api helpers *****************/

    loadDefaultData: async () => {
      // check if the data is already populated ...
      var reply = await client.get('restaurantId')

      if (!reply) {
        // Add default restaurants and tables
        let tIndex = 1
        client.set('ruleTables', 4)

        for (let rIndex = 1; rIndex <= 2; rIndex++) {
          client.incr('restaurantId')
          client.hset('restaurant:' + rIndex, 'Name', 'Restaurant ' + rIndex, 'tables', rIndex)
          client.sadd('restaurants', rIndex)
          for (var index = 1; index <= 20; index++, tIndex++) {
            client.incr('tablesId')
            client.sadd('tables:' + rIndex, tIndex)
            client.hset('table:' + tIndex, 'Name', 'Table ' + tIndex)
            client.hset('table:' + tIndex, 'restaurant', rIndex)
          }
        }
        // Add waiters
        for (let wIndex = 1; wIndex <= 8; wIndex++) {
          client.incr('waiterId')
          client.hset('waiter:' + wIndex, 'Name', 'Alice')
          client.sadd('restaurant:' + 1 + ':waiter:' + wIndex, wIndex)
          client.sadd('waiters', wIndex)
          client.hset('table:' + wIndex, 'waiter', wIndex)
        }
        // Add Manager
        client.incr('managerId')
        await client.hset('manager:' + 1, 'Name', 'Manager 1')
        return JSON.stringify('Defaults have been loaded')
      } else {
        return JSON.stringify('Aborting the request. Data exists ...')
      }
    },

    addRestaurant: async (name) => {
      await client.incr('restaurantId')
      var maxRestaurantid = await client.get('restaurantId')
      client.hset('restaurant:' + maxRestaurantid, 'Name', name, 'tables', maxRestaurantid)

      return { msg: 'Restaurant ' + name + ' has been added' }
    },

    addTable: async (restaurantId, tableName) => {
      if (!await isRestaurantValid(restaurantId)) {
        return { error: 'Not a valid restaurant' }
      }

      await client.incr('tablesId')
      var maxTablesId = await client.get('tablesId')
      client.hset('table:' + maxTablesId, 'Name', tableName, 'restaurant', restaurantId)
      await client.sadd('tables:' + restaurantId, maxTablesId)

      return { msg: 'table ' + tableName + ' has been added to the Restaurant ' + restaurantId }
    },

    delTable: async (restaurantId, tableId) => {
      var waiterId = client.hget('table:' + tableId, 'waiter')
      if (waiterId) {
        client.srem('restaurant:' + restaurantId + ':waiter:' + waiterId, tableId)
      }
      client.srem('tables:' + restaurantId, tableId)
      await client.del('table:' + tableId)

      return { msg: 'table ' + tableId + ' has been removed from restaurant ' + restaurantId }
    },

    addWaiter: async (name) => {
      var waiterId = await client.incr('waiterId')
      await client.hset('waiter:' + waiterId, 'Name', name)
      return { msg: 'Waiter ' + name + ' has been added' }
    },

    updateRule: async (number) => {
      await client.set('ruleTables', number)
      return { msg: 'Rule has been updated to ' + number }
    },

    removeWaiter: async waiterId => {
      if (!await isWaiterValid(waiterId)) {
        return { error: 'Unknown Waiter' }
      }

      client.srem('waiters', waiterId)
      client.del('waiter:' + waiterId + ':messages')
      var restaurants = await client.smembers('restaurants')
      for (const index in restaurants) {
        var tables = await client.smembers('restaurant:' + restaurants[index] + ':waiter:' + waiterId)
        for (const tIndex in tables) {
          client.hdel('table:' + tables[tIndex], 'waiter')
        }
        client.del('restaurant:' + restaurants[index] + ':waiter:' + waiterId)
        await client.del('waiter:' + waiterId + ':messages')

        return { msg: 'Waiter ' + waiterId + ' has been removed' }
      }
    }
  }
}
