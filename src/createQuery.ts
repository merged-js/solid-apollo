import type { WatchQueryOptions, OperationVariables } from '@apollo/client/core'
import type { DocumentNode } from 'graphql'
import type { Accessor } from 'solid-js'
import { createResource, onCleanup } from 'solid-js'

import { useApollo } from './ApolloProvider'

type BaseOptions<TData, TVariables> = Omit<WatchQueryOptions<TVariables, TData>, 'query'>

type CreateQueryOptions<TData, TVariables> = BaseOptions<TData, TVariables> | Accessor<BaseOptions<TData, TVariables>>

export const createQuery = <TData = any, TVariables = OperationVariables>(
  query: DocumentNode,
  options: CreateQueryOptions<TData, TVariables> = {}
) => {
  const apolloClient = useApollo()

  const [resource, { mutate }] = createResource<TData, BaseOptions<TData, TVariables>>(options, opts => {
    const observable = apolloClient.watchQuery<TData, TVariables>({ query, ...opts })

    let resolved = false
    return new Promise(resolve => {
      const sub = observable.subscribe({
        error: error => {
          throw error
        },
        next: ({ data, error }) => {
          if (error) {
            throw error
          }

          if (!resolved) {
            resolved = true
            resolve(data)
          } else {
            mutate(data as any)
          }
        },
      })

      onCleanup(() => {
        sub.unsubscribe()
      })
    })
  })

  return resource
}
