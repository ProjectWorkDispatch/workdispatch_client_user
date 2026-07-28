
import { Toaster } from 'react-hot-toast';
import './App.css'
import { AppRoutes } from './router/AppRoutes'


function App() {

  return( 
    <>
      <Toaster 
      position="top-center"
      containerStyle={{
        zIndex: 100000,
      }}
      toastOptions={{
        style: {
          fontFamily: "inherit",
          fontWeight: 600,
          fontSize: "1rem",
          borderRadius: "8px",
        }
      }}/>
      <AppRoutes />
    </>
  )
}

export default App;