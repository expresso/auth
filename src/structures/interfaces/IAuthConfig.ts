export interface IAuthConfig {
  requireUrn?: boolean,
  jwt: {
    audience: string,
    issuer: string,
    algorithms?: string[],
    secret?: string
  },
  jwks?: {
    uri: string,
    cache?: boolean,
    rateLimit?: boolean,
    requestsPerMinute?: number
  }
}
