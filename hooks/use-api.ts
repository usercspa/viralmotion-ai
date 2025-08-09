"use client"

import * as React from "react"
import type { APIError } from "@/lib/api-error"

export function useAsync<TArgs extends any[], TRes>(
  fn: (...args: TArgs) => Promise<TRes>,
  deps: React.DependencyList = [],
) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<APIError | null>(null)
  const [data, setData] = React.useState<TRes | null>(null)

  const run = React.useCallback(
    async (...args: TArgs) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fn(...args)
        setData(res)
        return res
      } catch (e: any) {
        setError(e)
        throw e
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  )

  return { loading, error, data, run, setData }
}
