export interface IAuthConfig {
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
