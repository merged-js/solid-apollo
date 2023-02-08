import type { WatchQueryOptions, OperationVariables } from '@apollo/client/core'
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'
import type { Accessor } from 'solid-js'
import { createResource, onCleanup } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'

import { useApollo } from './ApolloProvider'

interface BaseOptions<TData, TVariables extends OperationVariables> extends Omit<WatchQueryOptions<TVariables, TData>, 'query'> {
  skip?: boolean
}

type CreateQueryOptions<TData, TVariables extends OperationVariables> =
  | BaseOptions<TData, TVariables>
  | Accessor<BaseOptions<TData, TVariables>>

export const createQuery = <TData extends {} = {}, TVariables extends OperationVariables = OperationVariables>(
  query: DocumentNode<TData, TVariables>,
  options: CreateQueryOptions<TData, TVariables> = {}
) => {
  const apolloClient = useApollo()

  const optionsAccessor = () => {
    if (typeof options !== 'function') {
      if (options.skip) {
        console.warn(
          'you passed options.skip to createQuery, but the options are not an acccessor.\nThis query will never execute!\n\nReplace your options with a function.'
        )
      }

      return options
    }
    const opts = typeof options === 'function' ? options() : options
    if (opts.skip) {
      return false
    }
    return opts
  }

  const [resource] = createResource<TData, BaseOptions<TData, TVariables>>(optionsAccessor, opts => {
    const observable = apolloClient.watchQuery<TData, TVariables>({ query, ...opts })
    const [state, setState] = createStore<TData>({} as any)

    let resolved = false
    return new Promise((resolve, reject) => {
      const sub = observable.subscribe({
        error: reject,
        next: ({ data, error }) => {
          if (error) {
            reject(error)
          }

          if (!resolved) {
            resolved = true
            setState(data)
            resolve(state)
          } else {
            setState(reconcile(data))
          }
        },
      })

      onCleanup(() => sub.unsubscribe())
    })
  })

  return resource
}
