export interface IJwtSafeRequest extends Request {
  user: {
    sub: string,
    scope: string
  }
}
