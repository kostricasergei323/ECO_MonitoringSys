import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css';
import { AdvancedMap } from './components/advancedmap/advancedmap.jsx';
import { Dictionary } from './components/dictionary/dictionary.jsx';
import { Home } from './components/home/home.jsx';
import { MapView } from './components/map/map.jsx';
import { MenuView } from './components/menu/menu.jsx';

import { ENVIRONMENTS_URL } from './utils/constants';
import { get } from './utils/httpService';

import {
  EnvironmentsInfoContext,
  environmentsInfoInitialState,
} from './components/context/environmentsInfoContext';
import { LoaderContext } from './components/context/loaderContext';

export const App = () => {
  const [user, setUser] = useState({});
  const [environmentsInfo, setEnvironmentsInfo] = useState(
    environmentsInfoInitialState
  );
  const [dictionary, setDictionary] = useState('');

  const isLoadingRef = useRef(false);
  const loadingTextRef = useRef('');

  React.useEffect(() => {
    setUser(JSON.parse(sessionStorage.getItem('user')));
  }, []);

  useEffect(() => {
    get(ENVIRONMENTS_URL).then(({ data }) => {
      setEnvironmentsInfo({
        selected: null,
        environments: data,
      });
    });
  }, []);

  return (
    <Router>
      <div className='App'>
        <EnvironmentsInfoContext.Provider
          value={{ environmentsInfo, setEnvironmentsInfo }}
        >
          <MenuView
            user={user}
            setUser={setUser}
            dictionary={dictionary}
            setDictionary={setDictionary}
          />
          <Routes>
            <Route exact path='/' element={<Home />} />
            <Route
              path='/earth'
              element={
                <LoaderContext.Provider
                  value={{
                    isLoading: isLoadingRef,
                    loadingText: loadingTextRef,
                  }}
                >
                  <MapView user={user} />
                </LoaderContext.Provider>
              }
            />
            <Route
              path='/dictionary'
              element={
                user ? (
                  <Dictionary user={user} tableName={dictionary} />
                ) : (
                  <Home />
                )
              }
            />
            <Route path='/advancedmap' element={<AdvancedMap user={user} />} />
          </Routes>
        </EnvironmentsInfoContext.Provider>
      </div>
    </Router>
  );
};
