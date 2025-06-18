import React from 'react'
import Login from './Login'
import SignUp from './components/SignUp';


import NotesBrowsingPage from './NotesBrowsingPage'
import NotesUploadPage from './components/NotesUploadPage'
function App() {


  return (
    <>
    <Login/>
    <NotesBrowsingPage/>
    <NotesUploadPage/>
    <SignUp />    
    </>
  )
}
export default App
