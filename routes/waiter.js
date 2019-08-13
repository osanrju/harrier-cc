
var express = require('express')
var router = express.Router()
const model = require('../model/model')
const asyncmw = require('../utils/errorHandler')

const dbUtils = model()

/**
 * @api {get} /waiter/:wid Waiter Assignments
 * @apiName Assignments
 * @apiGroup waiter
 *
 * @apiParam {Integer} wid WaiterId
 *
 * @apiSampleRequest /waiter/:wid
 */
router.get('/:wid', asyncmw(async (req, res, next) => {
  const restaurants = await dbUtils.getRestaurants()
  var response = await dbUtils.getAssignments(req.params.wid, restaurants)
  res.json(response)
}))

module.exports = router
