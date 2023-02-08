import type { SubscriptionOptions, OperationVariables } from '@apollo/client/core'
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'
import type { Accessor } from 'solid-js'
import { createResource, onCleanup } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'

import { useApollo } from './ApolloProvider'

type BaseOptions<TData, TVariables> = Omit<SubscriptionOptions<TVariables, TData>, 'query'>

type CreateSubscriptionOptions<TData, TVariables> = BaseOptions<TData, TVariables> | Accessor<BaseOptions<TData, TVariables>>

export const createSubscription = <TData extends {} = {}, TVariables extends OperationVariables = OperationVariables>(
  subscription: DocumentNode<TData, TVariables>,
  options: CreateSubscriptionOptions<TData, TVariables> = {}
) => {
  const apolloClient = useApollo()

  const [resource] = createResource<TData, BaseOptions<TData, TVariables>>(options, opts => {
    const observable = apolloClient.subscribe<TData, TVariables>({ query: subscription, ...opts })
    const [state, setState] = createStore<TData>({} as any)

    let resolved = false
    return new Promise((resolve, reject) => {
      const sub = observable.subscribe({
        error: reject,
        next: ({ data }) => {
          if (!resolved) {
            resolved = true
            setState(data!)
            resolve(state)
          } else {
            setState(reconcile(data!))
          }
        },
      })

      onCleanup(() => sub.unsubscribe())
    })
  })

  return resource
}
