import * as React from "react"

import {createRoot} from 'react-dom/client';
import {App} from "./app.tsx"
import "./index.css"
import {update} from "./state/update.ts"

const app = document.getElementById('app');

const root = createRoot(app!)

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = {error: null};

  static getDerivedStateFromError(error: Error) {
    return {error};
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{padding: '20px', color: 'red'}}>
          <h1>Something went wrong.</h1>
          <pre>{(this.state.error as Error).message}</pre>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function rerender() {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App/>
      </ErrorBoundary>
    </React.StrictMode>
  )
}

update.onUpdate.push(rerender);
rerender();
