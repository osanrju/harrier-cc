/* eslint-disable no-undef */

const dbUtils = require('../utils/db')

let client

const db = dbUtils()

beforeAll(async done => {
  client = await db.getDb()
  client.on('error', (err) => {
    console.log(err)
  })

  client.on('connect', async () => {
    await client.select(9, () => {
      done()
    })
  })
})

test('dbconnection', async () => {
  expect(await client.ping()).toBe('PONG')
})
