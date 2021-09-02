import type { ApolloClient } from '@apollo/client/core'
import type { Component } from 'solid-js'
import { createContext, useContext } from 'solid-js'

const ApolloContext = createContext<ApolloClient<any>>()

export interface ApolloProviderProps {
  client: ApolloClient<any>
}

export const ApolloProvider: Component<ApolloProviderProps> = props => (
  <ApolloContext.Provider value={props.client}>{props.children}</ApolloContext.Provider>
)

export const useApollo = () => useContext(ApolloContext)
