import { mergeOptions } from '@apollo/client/core'
import type { DefaultContext, OperationVariables, MutationOptions, FetchResult } from '@apollo/client/core'
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core'
import type { GraphQLError } from 'graphql'
import type { Accessor } from 'solid-js'
import { createResource, createSignal, untrack } from 'solid-js'

import { useApollo } from './ApolloProvider'

interface BaseOptions<TData, TVariables, TContext> extends Omit<MutationOptions<TData, TVariables, TContext>, 'mutation'> {
  ignoreResults?: boolean
}

type CreateMutationOptions<TData, TVariables, TContext> =
  | BaseOptions<TData, TVariables, TContext>
  | Accessor<BaseOptions<TData, TVariables, TContext>>

export const createMutation = <TData = any, TVariables = OperationVariables, TContext = DefaultContext>(
  mutation: DocumentNode<TData, TVariables>,
  options: CreateMutationOptions<TData, TVariables, TContext> = {}
) => {
  const apolloClient = useApollo()
  let resolveResultPromise: ((data: TData) => void) | null = null
  let rejectResultPromise: ((error: GraphQLError) => void) | null = null

  const [executionOptions, setExecutionOptions] = createSignal<false | MutationOptions<TData, TVariables, TContext>>(false)
  const [resource] = createResource(executionOptions, async opts => {
    let result: FetchResult<TData>
    try {
      result = await apolloClient.mutate<TData, TVariables, TContext>(opts)
    } catch (error) {
      if (rejectResultPromise) {
        rejectResultPromise(error as GraphQLError)
        rejectResultPromise = null
      }
      throw error
    }
    const { data, errors } = result
    if (errors) {
      if (rejectResultPromise) {
        rejectResultPromise(errors[0])
        rejectResultPromise = null
      }
      throw errors[0]
    }

    if (resolveResultPromise) {
      resolveResultPromise(data!)
      resolveResultPromise = null
    }

    return data
  })

  return [
    async (opts: BaseOptions<TData, TVariables, TContext> = {}) => {
      const mergedOptions = mergeOptions<MutationOptions<TData, TVariables, TContext>>(opts, {
        mutation,
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
