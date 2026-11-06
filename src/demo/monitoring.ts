// The demo doesn't report errors anywhere: same functions as src/lib/monitoring.ts, doing nothing.

import { Component, type ReactNode } from "react";

export function withoutQuery(url: string) {
  return url.split(/[?#]/)[0];
}

export function startMonitoring() {}

export function setMonitoringUser(_id: string | null) {}

export class ErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
