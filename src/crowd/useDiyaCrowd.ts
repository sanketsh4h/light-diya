import { useEffect, useState } from 'react'
import { DIYA_GOAL } from '../config/site'
import { deviceId, siteCrowd } from './crowd'

const crowd = siteCrowd(import.meta.env)

/** How often to ask for the count: quickly at first, then more gently. */
const FIRST_POLL_MS = 2500
const SLOWEST_POLL_MS = 8000
/** A tab nobody is looking at asks rarely. */
const HIDDEN_POLL_MS = 20000

export interface DiyaCrowd {
  /** False when this build has no shared count: lighting the diya is enough. */
  enabled: boolean
  /** Devices that have lit a diya, or null until the first answer arrives. */
  count: number | null
  goal: number
  /** True once the goal is reached (or at once, when there is no shared count). */
  complete: boolean
}

/**
 * Once this device's diya is lit: count it, then keep asking how many devices
 * have lit theirs until the goal is reached. Nothing is sent before `lit`.
 * Failed requests are tried again on the next round.
 */
export function useDiyaCrowd(lit: boolean): DiyaCrowd {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    if (!lit || !crowd) return
    const shared = crowd
    let stopped = false
    let registered = false
    let delay = FIRST_POLL_MS
    let timer: number | undefined

    async function ask() {
      window.clearTimeout(timer)
      try {
        if (!registered) {
          await shared.register(deviceId())
          registered = true
        }
        const total = await shared.count(DIYA_GOAL)
        if (stopped) return
        setCount(total)
        if (total >= DIYA_GOAL) {
          stopped = true
          return
        }
      } catch {
        // Offline, or the service is busy: ask again on the next round.
      }
      if (stopped) return
      timer = window.setTimeout(ask, document.hidden ? HIDDEN_POLL_MS : delay)
      delay = Math.min(SLOWEST_POLL_MS, Math.round(delay * 1.15))
    }

    /** Coming back to the tab asks straight away. */
    function onVisible() {
      if (!document.hidden && !stopped) void ask()
    }

    void ask()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [lit])

  if (!crowd) return { enabled: false, count: null, goal: DIYA_GOAL, complete: lit }
  return { enabled: true, count, goal: DIYA_GOAL, complete: count !== null && count >= DIYA_GOAL }
}
