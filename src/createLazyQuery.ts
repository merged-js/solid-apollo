import { mergeOptions } from '@apollo/client/core'
import type { QueryOptions, OperationVariables, ApolloError } from '@apollo/client/core'
import type { DocumentNode } from 'graphql'
import type { Accessor } from 'solid-js'
import { onCleanup, untrack, createSignal, createResource } from 'solid-js'

import { useApollo } from './ApolloProvider'

interface BaseOptions<TData, TVariables> extends Omit<QueryOptions<TVariables, TData>, 'query'> {
  suspend?: boolean
  ignoreResults?: boolean
}

type CreateQueryOptions<TData, TVariables> = BaseOptions<TData, TVariables> | Accessor<BaseOptions<TData, TVariables>>

export const createLazyQuery = <TData = any, TVariables = OperationVariables>(
  query: DocumentNode,
  options: CreateQueryOptions<TData, TVariables> = {}
) => {
  const apolloClient = useApollo()
  const [executionOptions, setExecutionOptions] = createSignal<false | QueryOptions<TVariables, TData>>(false)
  let resolveResultPromise: (data: TData) => void | null = null
  let rejectResultPromise: (error: ApolloError) => void | null = null

  const [resource, { mutate }] = createResource<TData, BaseOptions<TData, TVariables>>(executionOptions, opts => {
    const observable = apolloClient.watchQuery<TData, TVariables>({ query, ...opts })

    let resolved = false
    return new Promise(resolve => {
      const sub = observable.subscribe({
        error: error => {
          throw error
        },
        next: ({ data, error }) => {
          if (error) {
            if (rejectResultPromise) {
              rejectResultPromise(error)
              rejectResultPromise = null
            }
            throw error
          }

          if (!resolved) {
            resolved = true
            if (resolveResultPromise) {
              resolveResultPromise(data)
              resolveResultPromise = null
            }
            resolve(data)
          } else {
            mutate(data as any)
          }
        },
      })

      onCleanup(() => sub.unsubscribe())
    })
  })

  return [
    async (opts: BaseOptions<TData, TVariables> = {}) => {
      const mergedOptions = mergeOptions(opts, { query, ...(typeof options === 'function' ? untrack(options) : options) })
      setExecutionOptions(mergedOptions)
      return new Promise<TData>((resolve, reject) => {
        resolveResultPromise = resolve
        rejectResultPromise = reject
      })
    },
    resource,
  ] as const
}
