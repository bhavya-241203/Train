import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

/**
 * Returns `undefined` while the query is still loading, `null` once it has
 * resolved and found no profile, or the Profile once onboarding is done.
 * Dexie's `get()` alone can't distinguish "loading" from "no row" since both
 * read as `undefined`, which would otherwise strand the app on a loading
 * screen forever for a brand new install.
 */
export function useProfile() {
  return useLiveQuery(() => db.profile.get(1).then((p) => p ?? null), [])
}

export function useActiveSplit(activeSplitId: string | undefined) {
  return useLiveQuery(() => (activeSplitId ? db.splits.get(activeSplitId) : undefined), [activeSplitId])
}
