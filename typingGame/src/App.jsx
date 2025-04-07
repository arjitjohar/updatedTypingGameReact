import { useState } from 'react'
import './App.css'
import TypingGame from './components/TypingGame'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      
        <TypingGame />
      
        <h1 class="text-3xl font-bold underline">
      Hello world!
</h1>  
    </>
  )
}

export default App
