import { mergeOptions } from '@apollo/client/core'
import type { DefaultContext, OperationVariables, MutationOptions } from '@apollo/client/core'
import type { DocumentNode, GraphQLError } from 'graphql'
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
  mutation: DocumentNode,
  options: CreateMutationOptions<TData, TVariables, TContext>
) => {
  const apolloClient = useApollo()
  let resolveResultPromise: (data: TData) => void | null = null
  let rejectResultPromise: (error: GraphQLError) => void | null = null

  const [executionOptions, setExecutionOptions] = createSignal<false | MutationOptions<TData, TVariables, TContext>>(false)
  const [resource] = createResource(executionOptions, async opts => {
    const { data, errors } = await apolloClient.mutate<TData, TVariables, TContext>(opts)

    if (errors) {
      if (rejectResultPromise) {
        rejectResultPromise(errors[0])
        rejectResultPromise = null
      }
      throw errors[0]
    }

    if (resolveResultPromise) {
      resolveResultPromise(data)
      resolveResultPromise = null
    }

    return data
  })

  return [
    async (opts: BaseOptions<TData, TVariables, TContext> = {}) => {
      const mergedOptions = mergeOptions(opts, { mutation, ...(typeof options === 'function' ? untrack(options) : options) })

      setExecutionOptions(mergedOptions)
      return new Promise<TData>((resolve, reject) => {
        resolveResultPromise = resolve
        rejectResultPromise = reject
      })
    },
    resource,
  ] as const
}
