import { mergeOptions } from '@apollo/client/core'
import type { QueryOptions, OperationVariables, ApolloError } from '@apollo/client/core'
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'
import type { Accessor } from 'solid-js'
import { onCleanup, untrack, createSignal, createResource } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'

import { useApollo } from './ApolloProvider'

interface BaseOptions<TData, TVariables> extends Omit<QueryOptions<TVariables, TData>, 'query'> {
  suspend?: boolean
  ignoreResults?: boolean
}

type CreateQueryOptions<TData, TVariables> = BaseOptions<TData, TVariables> | Accessor<BaseOptions<TData, TVariables>>

export const createLazyQuery = <TData extends {} = {}, TVariables extends OperationVariables = OperationVariables>(
  query: DocumentNode<TData, TVariables>,
  options: CreateQueryOptions<TData, TVariables> = {}
) => {
  const apolloClient = useApollo()
  const [executionOptions, setExecutionOptions] = createSignal<false | QueryOptions<TVariables, TData>>(false)
  let resolveResultPromise: ((data: TData) => void) | null = null
  let rejectResultPromise: ((error: ApolloError) => void) | null = null

  const [resource] = createResource<TData, BaseOptions<TData, TVariables>>(executionOptions, opts => {
    const observable = apolloClient.watchQuery<TData, TVariables>({ query, ...opts })
    const [state, setState] = createStore<TData>({} as any)

    let resolved = false
    return new Promise((resolve, reject) => {
      const sub = observable.subscribe({
        error: reject,
        next: ({ data, error }) => {
          if (error) {
            if (rejectResultPromise) {
              rejectResultPromise(error)
              rejectResultPromise = null
            }
            reject(error)
          }

          if (!resolved) {
            resolved = true
            if (resolveResultPromise) {
              resolveResultPromise(data)
              resolveResultPromise = null
            }
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

  return [
    async (opts: BaseOptions<TData, TVariables> = {}) => {
      const mergedOptions = mergeOptions<QueryOptions<TVariables, TData>>(opts, {
        query,
        ...(typeof options === 'function' ? untrack(options) : options),
      })
      setExecutionOptions(mergedOptions)
      return new Promise<TData>((resolve, reject) => {
        resolveResultPromise = resolve
        rejectResultPromise = reject
      })
    },
    resource,
  ] as const
}
