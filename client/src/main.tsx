import { Buffer } from 'buffer/';
import process from 'process';
import util from 'util';

(window as any).global  = window;
(window as any).Buffer  = Buffer;
(window as any).process = process;
(window as any).util    = {
  ...util,
  debuglog: () => () => {}, 
  inspect: (...args: any[]) => JSON.stringify(args),
};

import { StrictMode } from 'react';
import { createRoot }  from 'react-dom/client';
import App             from './App';
import { SettingsProvider } from './context/SettingsContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <SettingsProvider>
    <App />
  </SettingsProvider>,
);
