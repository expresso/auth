import { Request } from 'express'

export interface IAuthenticatedRequest extends Request {
  user?: {
    id: string,
    type: string,
    urn: string,
    scopes: string[]
  }
}
