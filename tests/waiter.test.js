/* eslint-disable no-undef */

const dbUtils = require('../utils/db')
const model = require('../model/model')

let client

const db = dbUtils()
const waiter = model()

beforeAll(async () => {
  client = await db.getDb()
  client.on('error', (err) => {
    console.log(err)
  })

  client.on('connect', async () => {
    await client.select(11, () => {
    })
  })

  await client.select(11)
  await waiter.loadDefaultData()
})

describe('Waiter', () => {
  test('can see allotments accross multiple restaurants', async () => {
    var obj = await waiter.getAssignments(1, await waiter.getRestaurants())
    var expected = {}
    expected.waiter = {
      id: 1,
      name: 'Alice',
      messages: []
    }
    expected.restaurantDetails = [{ id: '1', Name: 'Restaurant 1', tablesAssigned: ['Table 1'] }]

    expect(obj.waiter).toEqual(expected.waiter)
    expect(obj.restaurantDetails).toEqual(expect.arrayContaining(expected.restaurantDetails))
  })

  test('if invalid cannot view assignments', async () => {
    var obj = await waiter.getAssignments(100, await waiter.getRestaurants())
    expect(obj.error).toBe('Unknown Waiter')
  })
})

afterAll(async () => {
  client.flushdb()
})
