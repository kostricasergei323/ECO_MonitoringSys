import React from 'react';
import ReactDOM from 'react-dom/client';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

import { App } from './App';
import * as serviceWorker from './serviceWorker';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
