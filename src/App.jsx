import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [routes, setRoutes] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    supabase.auth.onAuthStateChange((_event, session) => setSession(session))
  }, [])

  useEffect(() => {
    if (session) loadRoutes()
  }, [session])

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMsg(error.message)
  }

  async function signup() {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMsg(error.message)
    else setMsg('Check your email to confirm signup.')
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  async function saveRoute() {
    if (!origin || !destination) { setMsg('Fill in both fields.'); return }
    const { error } = await supabase.from('saved_routes').insert({
      user_id: session.user.id, origin, destination
    })
    if (error) { setMsg('DB error: ' + error.message); return }
    setOrigin('')
    setDestination('')
    setMsg('Route saved!')
    loadRoutes()
  }

  async function deleteRoute(id) {
    await supabase.from('saved_routes').delete().eq('id', id)
    loadRoutes()
  }

  async function loadRoutes() {
    const { data, error } = await supabase
      .from('saved_routes')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    if (!error) setRoutes(data)
  }

  if (!session) return (
    <div className="container">
      <header>UGA Transit</header>
      <h2>Login</h2>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={login}>Log In</button>
      <button className="secondary" onClick={signup}>Sign Up</button>
      <p className="msg">{msg}</p>
    </div>
  )

  return (
    <div className="container">
      <header>UGA Transit <button className="secondary small" onClick={logout}>Log Out</button></header>
      <h2>Search a Route</h2>
      <input placeholder="From" value={origin} onChange={e => setOrigin(e.target.value)} />
      <input placeholder="To" value={destination} onChange={e => setDestination(e.target.value)} />
      <button onClick={saveRoute}>Save Route</button>
      <p className="msg">{msg}</p>
      <hr />
      <h2>Saved Routes</h2>
      {routes.length === 0 && <p>No saved routes yet.</p>}
      {routes.map(r => (
        <div className="card" key={r.id}>
          <span>{r.origin} → {r.destination}</span>
          <button className="secondary small" onClick={() => deleteRoute(r.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}

export default App
