declare module 'bcryptjs' {
  export function compare(data: string, encrypted: string): Promise<boolean>
  export function hash(data: string, salt: string | number): Promise<string>
}
