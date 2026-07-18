import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/App';
import './styles.css';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('No se encontró el contenedor principal de la aplicación.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

