import { useCallback, useEffect, useState } from 'react'

/** Shared read-only data loader; retry and stale-response protection. */
export function useResource(fetcher, argument = null) {
  const [refreshId, setRefreshId] = useState(0)
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const retry = useCallback(() => setRefreshId((n) => n + 1), [])
  useEffect(() => {
    let active = true
    Promise.resolve().then(() => {
      if (active) setState((old) => ({ ...old, loading: true, error: null }))
      return fetcher(argument)
    }).then((data) => { if (active) setState({ data, loading: false, error: null }) })
      .catch((error) => { if (active) setState({ data: null, loading: false, error }) })
    return () => { active = false }
  }, [fetcher, argument, refreshId])
  return { ...state, retry }
}
