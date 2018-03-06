import * as cookie from 'cookie'
import Request from './request.ts'

const cookieAttributeNames = ['maxAge', 'expires', 'httpOnly', 'secure', 'path', 'sameSite', 'domain']

/**
 * A jar for storing delicious cookies.
 * @class
 * @param {Response|Request} [parent] Underlying resource that contains cookies in headers
 */
export default class CookieJar {
  private parent: Request | Response
  private cookies: { [key: string]: string }[]

  constructor(parent: Request | Response) {
    this.parent = parent
    if (parent instanceof Request) {
      this.cookies = parseCookies(parent.headers.get('Cookie'))
    }
    else if (parent instanceof Response) {
      this.cookies = parseCookies(parent.headers.get('Set-Cookie'))
    } else {
      throw new TypeError('Expected parent to be instance of Request or Response.')
    }
  }

	/**
	 * Gets a cookie by name
	 * @param {String} name
	 */
  get(name: string) {
    return this.cookies.find((c) => c.name === name)
  }

	/**
	 * Sets a cookie, and applies it to the underlying {@linkcode Request} or {@linkcode Response}
	 * @param {String} name
	 * @param {String} value
	 * @param {Object} [options]
	 */
  append(name: string, value: string, options: Object) {
    const cookieStr = cookie.serialize(name, value, options)
    this.cookies = this.cookies.concat(parseCookie(cookieStr))
    if (this.parent instanceof Request)
      this.parent.headers.append('Cookie', cookieStr)
    else if (this.parent instanceof Response)
      this.parent.headers.append('Set-Cookie', cookieStr)
  }
}

function parseCookies(rawCookies: string | null): { [key: string]: string }[] {
  let cookies: { [key: string]: string }[] = []
  if (rawCookies === null) {
    return cookies
  }

  for (let c of rawCookies.split(',')) {
    cookies = cookies.concat(parseCookie(c))
  }
  return cookies
}

function parseCookie(cookieStr: string): { [key: string]: string }[] {
  let options: { [s: string]: string } = {}
  let cookies = []
  let parsed = cookie.parse(cookieStr)
  for (let attr in parsed) {
    if (cookieAttributeNames.indexOf(attr) != -1) {
      options[attr] = String(parsed[attr])
      continue
    }
    cookies.push({ name: attr, value: parsed[attr] })
  }
  return cookies.map((c) => Object.assign(c, options))
}
