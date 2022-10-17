import React from 'react';
import { useContext } from 'react';
import { Button, NavDropdown, Navbar } from 'react-bootstrap';
import Nav from 'react-bootstrap/Nav';
import { useNavigate, useLocation } from 'react-router-dom';

import { TABLE_NAMES } from '../../utils/constants';

import { Login } from '../auth/login';
import { EnvironmentsInfoContext } from '../context/environmentsInfoContext';
import { useState } from 'react';
import { RadioWidget } from '../radiowidget/radiowidget';

import './menu.css';

const TABLE_NAMES_ON_IU = {
  [TABLE_NAMES.elements]: 'Елементи',
  [TABLE_NAMES.gdk]: 'ГДК',
  [TABLE_NAMES.environment]: 'Середовища',
  [TABLE_NAMES.type_of_object]: 'Типи об`єктів',
  //[TABLE_NAMES.tax_values]: 'Податки',
};

export const MenuView = ({ user, setUser, dictionary, setDictionary }) => {
  const history = useNavigate();

  const location = useLocation();

  const { environmentsInfo, setEnvironmentsInfo } = useContext(
    EnvironmentsInfoContext
  );

  const [isSpecial, setIsSpecial] = useState(false);

  const [showRadioModal, setshowRadioModal] = useState(false);

  const hideRadio = () => setshowRadioModal(false);
  const showRadio = () => setshowRadioModal(true);

  const logOut = () => {
    setUser(null);
    sessionStorage.removeItem('user');
  };

  const selectEnvironment = (id, name, setMapChosenType) => {
    const selectedEnvironment = environmentsInfo.environments.find(
      ({ id: environmentId }) => +environmentId === +id
    );

    setEnvironmentsInfo({
      selected: selectedEnvironment,
      environments: environmentsInfo.environments,
    });

    setDictionary(null);

    setIsSpecial(false);

    history('/earth');
  };

  const openAdvancedMap = () => {
    setEnvironmentsInfo({
      selected: null,
      environments: environmentsInfo.environments,
    });

    setDictionary(null);

    setIsSpecial(true);

    history('/advancedmap');
  };

  const selectDictionary = (name) => {
    setDictionary(name);

    setEnvironmentsInfo({
      selected: null,
      environments: environmentsInfo.environments,
    });

    setIsSpecial(false);
    history('/dictionary');
  };

  const isActive = (id) => id === environmentsInfo?.selected?.id;

  const navigateToHome = () => {
    setEnvironmentsInfo({
      selected: null,
      environments: environmentsInfo.environments,
    });
    setIsSpecial(false);
    setDictionary(null);

    history('/');
  };

  return (
    <Navbar bg='light' className='z-index' expand='lg'>
      <Navbar.Toggle aria-controls='menu-nav' />
      <Navbar.Collapse id='menu-nav' className=''>
        <Nav className='d-flex align-items-center container'>
          <Nav.Item>
            <Nav.Link
              style={primaryColorObject}
              onClick={() => navigateToHome()}
            >
              Домашня сторінка
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <NavDropdown
              title={<span className='text-primary'>Карта викидів</span>}
            >
              {environmentsInfo.environments.map(({ id, name }) => (
                <NavDropdown.Item
                  onClick={() => selectEnvironment(id, name)}
                  key={id}
                  active={isActive(id)}
                >
                  {name}
                </NavDropdown.Item>
              ))}
              <NavDropdown.Item
                onClick={() => openAdvancedMap()}
                active={isSpecial}
              >
                Спец мапа
              </NavDropdown.Item>
            </NavDropdown>
          </Nav.Item>
          {user && user.id_of_expert === 0 && (
            <Nav.Item>
              <NavDropdown
                title={<span className='text-primary'>Довідники</span>}
              >
                {Object.values(TABLE_NAMES).map((name, index) => (
                  <NavDropdown.Item
                    onClick={() => selectDictionary(name)}
                    key={index}
                    active={dictionary === name}
                  >
                    {TABLE_NAMES_ON_IU[name]}
                  </NavDropdown.Item>
                ))}
              </NavDropdown>
            </Nav.Item>
          )}
          {(location.pathname === '/earth' ||
            location.pathname === '/advancedmap') && (
            <Nav.Item>
              <Nav.Link style={primaryColorObject} onClick={showRadio}>
                Радіаційний моніторинг
              </Nav.Link>
              <RadioWidget
                showRadioModal={showRadioModal}
                hideRadio={hideRadio}
              />
            </Nav.Item>
          )}
          <Nav.Item className='menu_togler'>
            {user ? (
              <div className='d-flex align-items-center justify-content-center'>
                <h5 className='me-2 mb-0'>
                  Вітаємо, {user.FIO} ({user.expert_name})
                </h5>
                <Button variant='outline-secondary' size='md' onClick={logOut}>
                  Вийти
                </Button>
              </div>
            ) : (
              <Login setUser={setUser} />
            )}
          </Nav.Item>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

const primaryColorObject = {
  color: '#0275d8',
};
