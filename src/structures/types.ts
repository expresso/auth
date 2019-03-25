export type OneOrMore<T> = T | T[]
export type Assured<T> = { [P in keyof T]-?: Assured<T[P]> }
