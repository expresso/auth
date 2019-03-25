import boom from 'boom'
import { types } from './types'
import { scopes } from './scopes'
const jwksRsa = require('jwks-rsa')
import expressJwt from 'express-jwt'
import { Request, Response, NextFunction } from 'express'
import { IAuthConfig } from './structures/interfaces/IAuthConfig'
import { IJwtSafeRequest } from './structures/interfaces/IJwtSafeRequest'

/**
 * Checks options to see if a simple JWT secret, or a JWKS URL should be used to validate token signatures
 * @param options - Expresso auth options
 */
function getJwtSecret (options: IAuthConfig) {
  if (options.jwt && options.jwt.secret) return options.jwt.secret
  if (options.jwks) {
    const { jwks: { uri: jwksUri, cache = true, rateLimit = true } } = options
    const { jwks: { requestsPerMinute: jwksRequestsPerMinute = 6 } } = options
    return jwksRsa.expressJwtSecret(
      { cache, rateLimit, jwksRequestsPerMinute, jwksUri }
    )
  }
  return null
}

/**
 * Returns a set of middlewares to handle authentication through JWT
 * @param options.jwks.uri - JWKS URI
 * @param options.jwks.cache - Whether JWKS should or not use caching
 * @param options.jwks.rateLimit - Whether JWKS should or not use rate limiting
 * @param options.jwks.requestsPerMinute - How many requests per minute should JWKS do
 * @param options.jwt.audience - JWT aud claim
 * @param options.jwt.issuer - JWT iss claim
 * @param options.jwt.secret - JWT secret
 */
export function factory (options: IAuthConfig) {
  const { jwt: { audience, issuer, algorithms = [ 'RS256' ] } } = options
  const secret = getJwtSecret(options)

  const jwt = [
    /**
     * Authentication handler
     */
    expressJwt({ secret, audience, issuer, algorithms }),

    /**
     * Moes
     */
    (req: IJwtSafeRequest, _res: Response, next: NextFunction) => {
      const { scope, sub } = { ...req.user }

      if (!/urn:(user|sa):([a-f\d]{24})/i.test(sub)) {
        return next(boom.unauthorized('an unacceptable identity urn was given', undefined, { code: 'invalid_identity_urn' }))
      }

      const urnRegex = /urn:([a-zA-Z]+):([a-f\d]{24})/i.exec(sub)

      const [ urn, type, id ] = urnRegex
        ? urnRegex
        : [null, null, null]

      if (!urn || !type || !id) {
        return next(boom.unauthorized('an unacceptable identity urn was given', undefined, { code: 'invalid_identity_urn' }))
      }

      Object.defineProperty(req, 'user', {
        value: { id, type, urn, scopes: scope.split(' ') },
        writable: false
      })

      next()
    },

    /**
     * Error handler
     */
    (err: Error, _req: Request, _res: Response, next: NextFunction) => {
      if (err instanceof expressJwt.UnauthorizedError) {
        return next(boom.unauthorized(err.message.toLowerCase()))
      }

      next(err)
    }
  ]

  return { jwt, scopes, types }
}

export default { factory, scopes, types }
