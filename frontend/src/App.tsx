import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"

import Dashboard from "./app/dashboard/page"
import Players from "./app/players/page"
import Tactics from "./app/tactics/page"

import Sidebar from "./components/layout/Sidebar"
import Topbar from "./components/layout/Topbar"

import "./App.css"

function App() {

  return (

    <Router>

      <div className="app-layout">

        <Sidebar />

        <div className="main-area">

          <Topbar />

          <div className="page-content">

            <Routes>

              <Route path="/" element={<Navigate to="/dashboard" />} />

              <Route path="/dashboard" element={<Dashboard />} />

              <Route path="/players" element={<Players />} />

              <Route path="/tactics" element={<Tactics />} />

            </Routes>

          </div>

        </div>

      </div>

    </Router>

  )

}

export default App