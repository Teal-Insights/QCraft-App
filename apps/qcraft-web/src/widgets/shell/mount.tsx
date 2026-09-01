/**
 * One mount path for all three widget entry points.
 *
 * Each widget is its own Vite entry (see vite.config.ts), so each needs a tiny
 * main file. The only thing those files should differ in is which component
 * they render, so everything else lives here.
 *
 * `document.title` is set from the widget's own name because these routes get
 * bookmarked and projected on their own, away from the Explorer.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

import '../../styles/app.css';
import '../../styles/widgets.css';

export function mountWidget(element: React.ReactElement, title: string) {
  document.title = title;
  const root = document.getElementById('root');
  if (!root) throw new Error('No #root element to mount the widget into');
  ReactDOM.createRoot(root).render(<React.StrictMode>{element}</React.StrictMode>);
}
