import type { SubscriptionOptions, OperationVariables } from '@apollo/client/core'
import type { DocumentNode } from 'graphql'
import type { Accessor } from 'solid-js'
import { createResource, onCleanup } from 'solid-js'

import { useApollo } from './ApolloProvider'

interface BaseOptions<TData, TVariables> extends Omit<SubscriptionOptions<TVariables, TData>, 'query'> {
  suspend?: boolean
}

type CreateSubscriptionOptions<TData, TVariables> = BaseOptions<TData, TVariables> | Accessor<BaseOptions<TData, TVariables>>

export const createSubscription = <TData = any, TVariables = OperationVariables>(
  subscription: DocumentNode,
  options: CreateSubscriptionOptions<TData, TVariables> = {}
) => {
  const apolloClient = useApollo()

  const [resource, { mutate }] = createResource<TData, BaseOptions<TData, TVariables>>(options, opts => {
    const observable = apolloClient.subscribe<TData, TVariables>({ query: subscription, ...opts })

    let resolved = false
    return new Promise(resolve => {
      const sub = observable.subscribe({
        error: error => {
          throw error
        },
        next: ({ data }) => {
          if (!resolved) {
            resolved = true
            resolve(data)
          } else {
            mutate(data as any)
          }
        },
      })

      if (opts.suspend !== true) {
        resolved = true
        resolve(undefined)
      }

      onCleanup(() => {
        sub.unsubscribe()
      })
    })
  })

  return resource
}
