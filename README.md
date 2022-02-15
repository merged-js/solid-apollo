# @merged/solid-apollo

A apollo client for solid

## Disclaimer

This is still under heavy development and not really "final".

## Usage

Usage is very similar to the original apollo react implementation

`createQuery`, `createLazyQuery`, `createMutation` and `createSubscription` return a resource object.

### Adding the ApolloProvider

The ApolloProvider should be placed early in your app

*main.tsx*
```tsx
import { ApolloProvider, ApolloClient } from '@merged/solid-apollo'
import { render } from 'solid-js/web'
import { Suspense } from 'solid-js'
import { App } from './App'

const client = new ApolloClient({
  // your client config
})

render(() => (
  <ApolloProvider client={client}>
    <Suspense fallback={<>App is loading…</>}>
      <App />
    </Suspense>
  </ApolloProvider>
), document.getElementById("root"))
```

### createQuery

`createQuery` can be typed and configured like [useQuery](https://www.apollographql.com/docs/react/api/react/hooks/#usequery).

`createQuery` creates a live query (`ApolloClient.watchQuery`) and will automatically update when the data gets updated.

```tsx
import { gql, createQuery } from '@merged/solid-apollo'
import type { Component } from 'solid-js'

const QUERY = gql`
  ... your query
`

export const App: Component = () => {
  const data = createQuery(QUERY)
  
  return (
    <>
      <h1>Query Response:</h1>
      {JSON.stringify(data())}
    </>
  )
}
```

### createLazyQuery

`createLazyQuery` can be typed and configured like [useLazyQuery](https://www.apollographql.com/docs/react/api/react/hooks/#uselazyquery)

```tsx
import { gql, createLazyQuery } from '@merged/solid-apollo'
import type { Component } from 'solid-js'

const QUERY = gql`
  ... your query
`

export const App: Component = () => {
  const [execute, data] = createLazyQuery(QUERY)
  
  return (
    <>
      <h1>Query Response:</h1>
      {JSON.stringify(data())}
      <button onClick={() => execute()}>Execute</button>
    </>
  )
}
```

### createMutation

`createMutation` can be typed and configured like [useMutation](https://www.apollographql.com/docs/react/api/react/hooks/#usemutation)

```tsx
import { gql, createMutation } from '@merged/solid-apollo'
import type { Component } from 'solid-js'

const MUTATION = gql`
  ... your mutation
`

export const App: Component = () => {
  const [mutate, data] = createMutation(MUTATION)
  
  return (
    <>
      <h1>Mutation Response:</h1>
      {JSON.stringify(data())}
      <button onClick={() => mutate()}>Execute</button>
    </>
  )
}
```

### createSubscription

`createSubscription` can be typed and configured like [useSubscription](https://www.apollographql.com/docs/react/api/react/hooks/#usesubscription)

```tsx
import { gql, createSubscription } from '@merged/solid-apollo'
import type { Component } from 'solid-js'

const SUBSCRIPTION = gql`
  ... your subscription
`

export const App: Component = () => {
  const data = createSubscription(SUBSCRIPTION)
  
  return (
    <>
      <h1>Subscription Data:</h1>
      {JSON.stringify(data())}
    </>
  )
}
```
