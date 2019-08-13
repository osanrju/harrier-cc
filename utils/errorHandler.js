
const asyncMiddleware = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    console.log(err)
    next(err)
  })
}

module.exports = asyncMiddleware
