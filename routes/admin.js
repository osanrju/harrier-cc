
var express = require('express')
var router = express.Router()
const model = require('../model/model')
const asyncmw = require('../utils/errorHandler')

const dbUtils = model()

/**
 * @api {get} /admin/loadDefaults Load Defaults
 * @apiName defaults
 * @apiGroup admin
 *
 * @apiSuccess {String} msg Defaults have been loaded.
 *
 * @apiSampleRequest /admin/loadDefaults
 */
router.get('/loadDefaults', asyncmw(async (req, res, next) => {
  res.send(await dbUtils.loadDefaultData())
}))

/**
 * @api {post} /admin/addRestaurant Add a restuarant
 * @apiName addRestaurant
 * @apiGroup admin
 *
 * @apiParam name
 *
 * @apiSampleRequest /admin/addRestaurant
 */
router.post('/addRestaurant', asyncmw(async (req, res, next) => {
  res.json(await dbUtils.addRestaurant(req.body.name))
}))

/**
 * @api {post} /admin/addTable Add a table
 * @apiName addTable
 * @apiGroup admin
 *
 * @apiParam {Integer} rid RestaurantId
 * @apiParam {String} name Table Name
 *
 * @apiSampleRequest /admin/addTable
 */
router.post('/addTable', asyncmw(async (req, res, next) => {
  res.json(await dbUtils.addTable(req.body.rid, req.body.name))
}))

/**
 * @api {delete} /admin/:rid/removeTable/:tid Delete a table
 * @apiName remove table
 * @apiGroup admin
 *
 * @apiParam {Integer} rid RestaurantId
 * @apiParam {Integer} tid TableId
 *
 * @apiSampleRequest /admin/:rid/removeTable/:tid
 */
router.delete('/:rid/removeTable/:tid', asyncmw(async (req, res, next) => {
  res.json(await dbUtils.delTable(req.params.rid, req.params.tid))
}))

/**
 * @api {post} /admin/addWaiter Add a waiter
 * @apiName addWaiter
 * @apiGroup admin
 *
 * @apiParam {String} name Waiter Name
 *
 * @apiSampleRequest /admin/addWaiter
 */
router.post('/addWaiter', asyncmw(async (req, res, next) => {
  res.json(await dbUtils.addWaiter(req.body.name))
}))

/**
 * @api {delete} /admin/fireWaiter/:wid Remove a waiter
 * @apiName remove waiter
 * @apiGroup admin
 *
 * @apiParam {Integer} wid WaiterId
  *
 * @apiSampleRequest /admin/fireWaiter/:wid
 */
router.delete('/fireWaiter/:wid', asyncmw(async (req, res, next) => {
  res.json(await dbUtils.removeWaiter(req.params.wid))
}))

/**
 * @api {put} /admin/setRule/:value Update the rule
 * @apiName remove waiter
 * @apiGroup admin
 *
 * @apiParam {Integer} value Max number of tables waiter can wait
  *
 * @apiSampleRequest /admin/setRule/:value
 */
router.put('/setRule/:value', asyncmw(async (req, res, next) => {
  res.json(await dbUtils.updateRule(req.params.value))
}))

// set the max number of tables
module.exports = router
