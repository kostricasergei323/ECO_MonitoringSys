import React, { useState, useEffect, useRef } from 'react';
import { Button, Form, Row, Col, Dropdown, FormControl } from 'react-bootstrap';
import { get } from '../../utils/httpService';
import { PolygonFiltration } from '../map/polygonFiltration';
import { useOnClickOutside } from '../helperComponents/outsideClick';

import './onMapFinder.css';

import { Pseudo } from '../helperComponents/pseudo/pseudo';
import axios from 'axios';

const initialConst = {
  Cities: null,
};

get('/getcities').then((data) => {
  initialConst.Cities = data.data;
});

const CitiesToogle = React.forwardRef(({ children, onClick }, ref) => (
  <a
    href=''
    ref={ref}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
  >
    {children}
    &#x25bc;
  </a>
));

const CitiesMenu = React.forwardRef(
  ({ children, style, className, 'aria-labelledby': labeledBy }, ref) => {
    const [value, setValue] = useState('');

    return (
      <div
        ref={ref}
        style={style}
        className={className}
        aria-labelledby={labeledBy}
      >
        <FormControl
          autoFocus
          className='my-2 m-auto'
          placeholder='Пошук...'
          onChange={(e) => setValue(e.target.value)}
          value={value}
          style={{ width: '90%' }}
        />
        <ul className='list-unstyled'>
          {React.Children.toArray(children).filter(
            (child) =>
              !value ||
              child.props.children.toLowerCase().startsWith(value) ||
              child.props.children.startsWith(value)
          )}
        </ul>
      </div>
    );
  }
);

const CityFinder = ({ ViewReposition }) => {
  const [cities, setCities] = useState([]);

  useEffect(() => {
    setCities(initialConst.Cities);
  }, [initialConst.Cities]);
  return (
    <Form>
      <Form.Label>Введіть назву міста </Form.Label>
      <Dropdown>
        <Dropdown.Toggle as={CitiesToogle} id='dropdown-custom-components'>
          Оберіть місто
        </Dropdown.Toggle>
        <Dropdown.Menu className='smallCities' as={CitiesMenu}>
          {cities &&
            cities.map((el, i) => {
              return (
                <Dropdown.Item
                  key={i}
                  onClick={() => {
                    ViewReposition(el.lat, el.lon);
                  }}
                >
                  {el.Name}
                </Dropdown.Item>
              );
            })}
        </Dropdown.Menu>
      </Dropdown>
    </Form>
  );
};

const CordFinder = ({ ViewReposition }) => {
  const [lat, setLat] = useState();
  const [lon, setLon] = useState();

  const [isinv, setisinv] = useState(false);

  const cordHandler = (e) => {
    if (!isNaN(lat) && !isNaN(lon)) {
      setisinv(false);
      ViewReposition(lat, lon);
    } else {
      setisinv(true);
    }
  };

  return (
    <Form>
      <Form.Label>Введіть координати </Form.Label>
      <Row style={{ width: '100%', marginRight: '0' }}>
        <Col>
          <Form.Control
            placeholder='Широта'
            className='input-invalid'
            size='sm'
            required
            isInvalid={isinv}
            onChange={(e) => {
              setLat(e.target.value);
            }}
          />
        </Col>
        <Col>
          <Form.Control
            placeholder='Довгота'
            className='input-invalid'
            size='sm'
            required
            isInvalid={isinv}
            onChange={(e) => {
              setLon(e.target.value);
            }}
          />
        </Col>
      </Row>
      <Button size='sm' className='subBTN' onClick={cordHandler}>
        {' '}
        Знайти{' '}
      </Button>
    </Form>
  );
};

const AdressFinder = ({ ViewReposition }) => {
  const [Adress, setAdress] = React.useState('');

  const [isInv, setIsInv] = React.useState(false);

  const [TempWarning, setTempWarning] = React.useState(false);

  const AdreesFinderHandler = () => {
    if (Adress) {
      setIsInv(false);
      axios
        .get(
          `https://nominatim.openstreetmap.org/search/?format=json&street=${Adress}&addressdetails=1&limit=1`
        )
        .then(({ data }) => {
          if (data[0]) {
            ViewReposition(data[0].lat, data[0].lon, 16);
          } else {
            setTempWarning(true);
          }
        });
    } else {
      setIsInv(true);
    }
  };

  React.useEffect(() => {
    if (TempWarning) {
      setTimeout(() => {
        setTempWarning(false);
      }, 3000);
    }
  }, [TempWarning]);

  return (
    <Form>
      <Form.Label> Введіть адресу </Form.Label>
      <Form.Control
        placeholder='Адреса детально'
        required
        size='sm'
        isInvalid={isInv}
        onChange={(e) => {
          setAdress(e.target.value);
        }}
      />
      <Form.Label className={TempWarning ? 'tempWarning' : 'tempWarningOff'}>
        Адреса не знайдена
      </Form.Label>
      <Button size='sm' className='subBTN' onClick={AdreesFinderHandler}>
        {' '}
        Знайти{' '}
      </Button>
    </Form>
  );
};

export const FinderOnMap = ({
  ViewReposition,
  setmapMode,
  sideRightFilterOpened,
  setRightFilterOpened,
}) => {
  const ref = useRef();
  useOnClickOutside(ref, () => {
    setRightFilterOpened(false);
  });

  return (
    <div
      ref={ref}
      className={`MapFinderForm ${sideRightFilterOpened ? '' : 'transRight'}`}
    >
      <Pseudo setOpened={setRightFilterOpened} />
      <div>
        <PolygonFiltration setmapMode={setmapMode} />
        <hr></hr>
        <CityFinder ViewReposition={ViewReposition} />
        <hr></hr>
        <CordFinder ViewReposition={ViewReposition} />
        <hr></hr>
        <AdressFinder ViewReposition={ViewReposition} />
      </div>
    </div>
  );
};
