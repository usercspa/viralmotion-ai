"use client"

import * as React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Props = {
  children: React.ReactNode
  fallbackTitle?: string
}

type State = {
  hasError: boolean
  error?: Error
}

export class ApiErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ApiErrorBoundary]", error)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="my-2">
          <AlertTitle>{this.props.fallbackTitle || "Something went wrong"}</AlertTitle>
          <AlertDescription>{this.state.error?.message || "Unknown error"}</AlertDescription>
        </Alert>
      )
    }
    return this.props.children
  }
}
