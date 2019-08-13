/* eslint-disable no-undef */

const dbUtils = require('../utils/db')
const model = require('../model/model')

let client

const db = dbUtils()
const manager = model()

beforeAll(async done => {
  client = await db.getDb()
  client.on('error', (err) => {
    console.log(err)
  })

  client.on('connect', async () => {
    await client.select(10, () => {
    })
  })

  await client.select(9)
  await manager.loadDefaultData()
  done()
})

describe('manager', () => {
  test('can view restaurants', async done => {
    var obj = await manager.getRestaurants()
    var expected = [{
      id: '1',
      name: 'Restaurant 1'
    }]

    expect(obj).toEqual(expect.arrayContaining(expected))
    done()
  })

  test('can view tables and assigned waiters', async () => {
    var obj = await manager.getTables(1)
    var expected = {
      restaurant: {
        id: '1',
        name: 'Restaurant 1'
      },
      tables: [{
        id: '1',
        waiterid: '1',
        waiter: 'Alice'
      }]
    }
    expect(obj.restaurant).toEqual(expected.restaurant)
    expect(obj.tables).toEqual(expect.arrayContaining(expected.tables))
  })

  test('cannot view restaurant that doesn\'t exist', async () => {
    var obj = await manager.getTables(4)
    var expected = {
      error: 'No restaurant found with the name!'
    }
    expect(obj).toEqual(expected)
  })

  test('cannot assign waiter to restaurant that doesn\'t exist', async () => {
    var obj = await manager.assignTable(100, 100, 100)
    var expected = {
      error: 'Not a valid restaurant'
    }
    expect(obj).toEqual(expected)
  })

  test('cannot assign waiter to table that doesn\'t exist', async () => {
    var obj = await manager.assignTable(1, 100, 100)
    var expected = {
      error: 'Not a valid Table'
    }
    expect(obj).toEqual(expected)
  })

  test('cannot assign an invalid waiter', async () => {
    var obj = await manager.assignTable(1, 1, 100)
    var expected = {
      error: 'Unknown waiter'
    }
    expect(obj).toEqual(expected)
  })

  test('cannot assign waiter to an already assigned table to same user', async () => {
    var obj = await manager.assignTable(1, 1, 1)
    var expected = {
      error: 'Table already assigned'
    }
    expect(obj).toEqual(expected)
  })

  test('cannot assign waiter to an already assigned table to different user', async () => {
    var obj = await manager.assignTable(1, 1, 2)
    var expected = {
      error: 'Table already assigned'
    }
    expect(obj).toEqual(expected)
  })

  test('can assign waiter to an unassigned table', async () => {
    var obj = await manager.assignTable(1, 10, 1)
    var expected = {
      msg: 'Table has been assigned'
    }
    expect(obj).toEqual(expected)
  })

  test('cannot assign waiter over the quota', async () => {
    await manager.assignTable(1, 11, 1)
    await manager.assignTable(1, 12, 1)
    var obj = await manager.assignTable(1, 13, 1)
    var expected = {}
    expected.error = 'Assignment is over the quota'
    expected.avaliableWaiters = [{ currentAssignment: 1, id: '2', name: 'Alice' }]

    expect(obj.error).toEqual(expected.error)
    expect(obj.availableWaiters).toEqual(expect.arrayContaining(expected.avaliableWaiters))
  })

  test('cannot clear an invalid table', async () => {
    var obj = await manager.clearTable(1, 100)
    var expected = {
      error: 'Not a valid Table'
    }
    expect(obj).toEqual(expected)
  })

  test('cannot clear a table in invalid restaurant', async () => {
    var obj = await manager.clearTable(5, 100)
    var expected = {
      error: 'Not a valid Table'
    }
    expect(obj).toEqual(expected)
  })

  test('cannot clear a table which wasn\'t assigned', async () => {
    var obj = await manager.clearTable(1, 9)
    var expected = {
      error: 'No Waiter is assigned to the table'
    }
    expect(obj).toEqual(expected)
  })

  test('can clear a table which is assigned', async () => {
    var obj = await manager.clearTable(1, 6)
    var expected = {
      msg: 'Table 6 has been cleared'
    }
    expect(obj).toEqual(expected)
  })
})

afterAll(async () => {
  await client.flushdb()
})
