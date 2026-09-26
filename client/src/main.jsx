import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RouterProvider } from 'react-router-dom'
import router from './route/index.jsx'
import { Provider } from 'react-redux'
import { store } from './store/store.js'
import GlobalProvider from './provider/GlobalProvider.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <Provider store={store}>
      <GlobalProvider>
        <ErrorBoundary>
          <RouterProvider router={router}/>
        </ErrorBoundary>
      </GlobalProvider>
    </Provider>

  // </StrictMode>,
)
