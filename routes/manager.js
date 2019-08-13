/* eslint-disable semi */

var express = require('express')
var router = express.Router()
const model = require('../model/model')
const asyncmw = require('../utils/errorHandler')

const dbUtils = model()

/**
 * @api {get} /manager Get available restaurants
 * @apiName Get restaurants
 * @apiGroup manager
 *
 * @apiSampleRequest /manager
 */
router.get('/', asyncmw(async (req, res, next) => {
  var response = await dbUtils.getRestaurants()
  res.json(response)
}))

/**
 * @api {get} /manager/restaurant/:rId Get tables in a restaurant
 * @apiName Get Tables
 * @apiGroup manager
 *
 * @apiParam {Integer} rId RestaurantId
 *
 * @apiSampleRequest /manager/restaurant/:rId
 */
router.get('/restaurant/:rId', asyncmw(async (req, res, next) => {
  var response = await dbUtils.getTables(req.params.rId);
  res.json(response)
}))

/**
 * @api {get} /manager/restaurant/waiters/:rId Get waiters in a restaurant
 * @apiName Get Waiters in a restaurant
 * @apiGroup manager
 *
 * @apiParam {Integer} rId RestaurantId
 *
 * @apiSampleRequest /manager/restaurant/waiters/:rId
 */
router.get('/restaurant/waiters/:rId', asyncmw(async (req, res, next) => {
  var response = await dbUtils.getWaiters(req.params.rId);
  res.json(response)
}))

/**
 * @api {put} /manager/restaurant/:rId/table/:tid/waiter/:wid Assign a table
 * @apiName Assign Table
 * @apiGroup manager
 *
 * @apiParam {Integer} rId RestaurantId
 * @apiParam {Integer} tid TableId
 * @apiParam {Integer} wid WaiterId
 *
 * @apiSampleRequest /manager/restaurant/:rId/table/:tid/waiter/:wid
 */
router.put('/restaurant/:rId/table/:tid/waiter/:wid', asyncmw(async (req, res, next) => {
  var response = await dbUtils.assignTable(req.params.rId, req.params.tid, req.params.wid)
  res.json(response)
}))

/**
 * @api {delete} /manager/restaurant/:rid/table/:tid/ Clear a table
 * @apiName clear Table
 * @apiGroup manager
 *
 * @apiParam {Integer} rid RestaurantId
 * @apiParam {Integer} tid TableId
 *
 * @apiSampleRequest /manager/restaurant/:rid/table/:tid
 */
router.delete('/restaurant/:rid/table/:tid', asyncmw(async (req, res, next) => {
  var response = await dbUtils.clearTable(req.params.rid, req.params.tid)
  res.json(response)
}))

module.exports = router
