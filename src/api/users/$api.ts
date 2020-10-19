/* eslint-disable */
import { AspidaClient, BasicHeaders } from 'aspida'
import { Methods as Methods0 } from './me'

const api = <T>({ baseURL, fetch }: AspidaClient<T>) => {
  const prefix = (baseURL === undefined ? '/v1/' : baseURL).replace(/\/$/, '')
  const PATH0 = '/users/me'
  const GET = 'GET'

  return {
    me: {
      get: (option?: { config?: T }) =>
        fetch<
          Methods0['get']['resBody'],
          BasicHeaders,
          Methods0['get']['status']
        >(prefix, PATH0, GET, option).json(),
      $get: (option?: { config?: T }) =>
        fetch<
          Methods0['get']['resBody'],
          BasicHeaders,
          Methods0['get']['status']
        >(prefix, PATH0, GET, option)
          .json()
          .then((r) => r.body),
      $path: () => `${prefix}${PATH0}`,
    },
  }
}

export type ApiInstance = ReturnType<typeof api>
export default api
