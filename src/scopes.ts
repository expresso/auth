import boom from 'boom'
import { format } from 'util'
import { OneOrMore, Assured } from './structures/types'
import { NextFunction, RequestHandler, Request, Response } from 'express'
import { IAuthenticatedRequest } from './structures/interfaces/IAuthenticatedRequest'

/**
 * Checks if a given path is contained in a scope
 * @param path - The path to look for
 * @param scope - Scope where the path should be contained
 * @param options - Config options
 * @param options.separator - Path part separator
 * @param options.wildcard - Wildcard character to use
 * @param optinos.wildcardIsRoot - Determines if wildcard is root
 */
function isPathInScope (path: string, scope: string[], { separator = '.', wildcard = '*', wildcardIsRoot = true } = {}) {
  return path.split(separator)
    .reduce<string[]>((possibilities, segment) => {
      const possibility = possibilities.slice(-1).length
        ? `${possibilities.slice(-1)[0]}${separator}${segment}`
        : segment

      possibilities.push(possibility)
      return possibilities
    }, [])
    .map(possibility => (possibility !== path) || wildcardIsRoot ? `${possibility}${separator}${wildcard}` : possibility)
    .concat([wildcard, path])
    .reduce((result, possibility) => result || scope.includes(possibility), false)
}

/**
 * Checks if a parsed JWT has the required scopes
 * @param expected - Expected scopes
 * @param shouldHaveAllScopes - Indicates if all scopes should be met, or if only one is required
 */
export function scopes (expected: OneOrMore<string>, shouldHaveAllScopes = true): RequestHandler {
  if (!Array.isArray(expected)) {
    return scopes(expected.split(' '))
  }

  return (req: Request, _res: Response, next: NextFunction) => {
    if (!(req as IAuthenticatedRequest).user || !Array.isArray((req as unknown as Assured<IAuthenticatedRequest>).user.scopes)) {
      return next(boom.unauthorized('authorization token is missing or has an invalid scope grant'))
    }

    const user = (req as unknown as Assured<IAuthenticatedRequest>).user

    const satisfied = shouldHaveAllScopes // If user should have all scopes
      ? expected.every((scope) => isPathInScope(scope, user.scopes)) // Checks if every scope is in user scopes
      : expected.some((scope) => isPathInScope(scope, user.scopes)) // Otherwise, checks if some scope is in user scopes

    if (!satisfied) {
      return next(boom.unauthorized(format('the following permissions are required: %s', expected.join(' ')), undefined, { code: 'insufficient_permissions' }))
    }

    next()
  }
}

scopes.or = (expected: OneOrMore<string>) => scopes(expected, false)
scopes.and = (expected: OneOrMore<string>) => scopes(expected, true)
