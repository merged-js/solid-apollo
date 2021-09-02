import { mergeOptions } from '@apollo/client/core'
import type { QueryOptions, OperationVariables, ApolloError } from '@apollo/client/core'
import type { DocumentNode } from 'graphql'
import type { Accessor } from 'solid-js'
import { untrack, createSignal, createResource } from 'solid-js'

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

  const [resource, { mutate }] = createResource(executionOptions, async opts => {
    const { data, error } = await apolloClient.query<TData, TVariables>({ query, ...opts })

    if (error) {
      if (rejectResultPromise) {
        rejectResultPromise(error)
        rejectResultPromise = null
      }
      throw error
    }

    if (resolveResultPromise) {
      resolveResultPromise(data)
      resolveResultPromise = null
    }

    return data
  })

  return [
    async (opts: BaseOptions<TData, TVariables> = {}) => {
      const mergedOptions = mergeOptions(opts, { query, ...(typeof options === 'function' ? untrack(options) : options) })
      if (mergedOptions.suspend !== false) {
        setExecutionOptions(mergedOptions)
        return new Promise<TData>((resolve, reject) => {
          resolveResultPromise = resolve
          rejectResultPromise = reject
        })
      }

      const { data, errors } = await apolloClient.query<TData, TVariables>(mergedOptions)

      if (errors) {
        throw errors[0]
      }

      if (!mergedOptions.ignoreResults) {
        mutate(data as any)
      }

      return data
    },
    resource,
  ] as const
}
