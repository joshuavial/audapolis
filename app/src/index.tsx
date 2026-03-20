import './polyfills';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';

import App from './components/App';
import { exportDebugLogsToDisk } from './util/log';
import { subscribeExportDebugLog } from '../ipc/ipc_renderer';

subscribeExportDebugLog((event, mainProcessLogPath) => exportDebugLogsToDisk(mainProcessLogPath));

window.addEventListener('error', (event) => {
  if (event.error?.stack) {
    console.error(event.error.stack);
  } else {
    console.error(event.message);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (reason?.stack) {
    console.error(reason.stack);
  } else {
    console.error(String(reason));
  }
});

const anyModule = module as any;
if (anyModule.hot) {
  anyModule.hot.accept();
}

ReactDOM.render(<App />, document.getElementById('root'));
