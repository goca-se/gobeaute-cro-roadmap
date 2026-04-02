import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ALLOWED_DOMAINS = ['gobeaute.com.br', 'gocase.com']

function isDomainAllowed(email) {
  if (!email) return false
  const domain = email.split('@')[1]
  return ALLOWED_DOMAINS.includes(domain)
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (!isDomainAllowed(session.user.email)) {
          supabase.auth.signOut()
          setError(`Acesso restrito ao domínio gobeaute.com.br e gocase.com`)
        } else {
          setSession(session)
          setUser(session.user)
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        if (!isDomainAllowed(session.user.email)) {
          supabase.auth.signOut()
          setError(`Acesso restrito ao domínio gobeaute.com.br e gocase.com`)
          setSession(null)
          setUser(null)
        } else {
          setError(null)
          setSession(session)
          setUser(session.user)
        }
      } else {
        setSession(null)
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    if (!supabase) return
    setError(null)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { user, session, loading, error, signInWithGoogle, signOut }
}
