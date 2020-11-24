import boom from '@hapi/boom'
import { format } from 'util'
import { OneOrMore } from './structures/types'
import { RequestHandler, NextFunction, Response } from 'express'
import { IAuthenticatedRequest } from './structures/interfaces/IAuthenticatedRequest'

/**
 * Returns a middleware that checks if subject type in parsed JWT is of required type
 * @param expected - Expected "sub" claim types
 */
export function types (expected: OneOrMore<string>): RequestHandler {
  if (!Array.isArray(expected)) {
    return types(expected.split(' '))
  }

  return (req: IAuthenticatedRequest, _res: Response, next: NextFunction) => {
    // This is necessary because, at runtime, we are never actually sure if user is filled
    // tslint:disable-next-line:strict-type-predicates
    if (!req.user || typeof req.user.type !== 'string') {
      return next(boom.unauthorized('authorization token is missing or has an invalid subject type'))
    }

    const hasExpectedType = expected.map(type => type.toLowerCase())
                                    .includes(req.user.type.toLowerCase())

    if (!hasExpectedType) {
      return next(boom.unauthorized(format('one of the following types is required: %s', expected.join(' ')), undefined, { code: 'invalid_type' }))
    }

    next()
  }
}
