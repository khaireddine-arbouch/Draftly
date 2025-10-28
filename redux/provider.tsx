'use client'

import React, { ReactNode } from 'react'
import { makeStore } from './store'
import { RootState } from './store'
import { Provider } from 'react-redux'

interface ReduxProviderProps {
  children: ReactNode
  preloadedState?: Partial<RootState>
}

const ReduxProvider: React.FC<ReduxProviderProps> = ({ children, preloadedState }) => {
  // Directly create the store here without useRef
  const store = makeStore(preloadedState)

  return <Provider store={store}>{children}</Provider>
}

export default ReduxProvider