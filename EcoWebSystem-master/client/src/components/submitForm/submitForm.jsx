import React, { useEffect, useState } from 'react';
import { Button, Dropdown, Form, Alert, Spinner } from 'react-bootstrap';

import { ELEMENTS_URL, GDK_FIND_URL } from '../../utils/constants';
import { post, get } from '../../utils/httpService';

import './submitForm.css';
import { useContext } from 'react';
import { EnvironmentsInfoContext } from '../context/environmentsInfoContext';

const now = new Date();
const year = now.getFullYear();
const month = ('0' + (now.getMonth() + 1)).slice(-2);
const day = ('0' + now.getDate()).slice(-2);

const initialState = {
  form: {
    date: `${year}-${month}-${day}`,
    valueAvg: 0,
    valueMax: 0,
    gdk: 100000,
    element: {
      code: 0,
      short_name: 'Оберіть елемент',
    },
    measure: '',
  },
};

export const SubmitForm = ({ onSave, preloadedEmission, isLoading }) => {
  const { environmentsInfo } = useContext(EnvironmentsInfoContext);

  const [isActive, setIsActive] = useState(false);
  const buttonText = isActive ? 'Сховати' : 'Показати більше';

  const [date, setDate] = useState(initialState.form.date);
  const [valueAvg, setAvgValue] = useState(initialState.form.valueAvg);
  const [gdkAvg, setGdkAvg] = useState(initialState.form.gdk);
  const [valueMax, setMaxValue] = useState(initialState.form.valueMax);
  const [gdkMax, setGdkMax] = useState(initialState.form.gdk);
  const [elements, setElements] = useState([]);
  const [selectedElement, setElement] = useState(initialState.form.element);
  const [measure, setMeasure] = useState(initialState.form.measure);

  const clearForm = () => {
    setDate(initialState.form.date);
    setAvgValue(initialState.form.valueAvg);
    setGdkAvg(initialState.form.gdk);
    setMaxValue(initialState.form.valueMax);
    setGdkMax(initialState.form.gdk);
    setElement(initialState.form.element);
    setMeasure(initialState.form.measure);
  };

  const onClick = () => {
    setIsActive(!isActive);
  };

  const handleSubmit = () => {
    let emission;

    if (isActive && date) {
      const [year, month, day] = date.split('-');

      emission = isActive && {
        valueAvg,
        valueMax,
        year,
        month,
        day,
        idElement: selectedElement.code,
        idEnvironment: environmentsInfo.selected.id,
        measure,
      };
    }

    onSave(emission);
    clearForm();
    setIsActive(false);
  };

  const selectElement = (element) => {
    setElement(element);
    setMeasure(element.measure);

    post(GDK_FIND_URL, {
      code: element.code,
      environment: environmentsInfo.selected.id,
    }).then(({ data }) => {
      if (data.average && data.max) {
        setGdkAvg(data.average);
        setGdkMax(data.max);
      } else {
        setGdkAvg(initialState.form.valueAvg);
        setGdkMax(initialState.form.valueMax);
      }
    });
  };

  const handleDate = (date) => {
    if (new Date(date) > now) {
      setDate(`${year}-${month}-${day}`);
    } else {
      setDate(date);
    }
  };

  useEffect(() => {
    get(ELEMENTS_URL).then(({ data }) => setElements(data));
  }, []);

  useEffect(() => {
    if (preloadedEmission) {
      try {
        const { date, elementName, maximumValue, averageValue } =
          preloadedEmission;

        const formattedDate = `${date.getFullYear()}-${(
          '0' +
          (date.getMonth() + 1)
        ).slice(-2)}-${('0' + date.getDate()).slice(-2)}`;

        handleDate(formattedDate);

        const element = elements.find(
          ({ short_name }) => short_name === elementName
        );

        selectElement(element);
        setAvgValue(+averageValue);
        setMaxValue(+maximumValue);

        setIsActive(true);
      } catch (error) {
        alert(error.toString());
        console.error(error);
      }
    }
  }, [preloadedEmission]);

  return (
    <>
      <div className='d-flex justify-content-center'>
        <Button onClick={onClick}>{buttonText}</Button>
      </div>
      {isActive && (
        <>
          <Form.Group className='mb-1'>
            <Form.Label>Оберіть дату</Form.Label>
            <Form.Control
              type='date'
              value={date}
              lang='uk'
              onChange={(e) => handleDate(e.target.value)}
            />
          </Form.Group>

          <Form.Group className='mb-1'>
            <Form.Label>Введіть середнє значення</Form.Label>
            <Form.Control
              type='number'
              min='0'
              value={valueAvg}
              onChange={(e) => setAvgValue(+e.target.value)}
            />
          </Form.Group>
          {gdkAvg > 0 && gdkAvg < valueAvg && (
            <Alert variant='danger'>
              Середнє значення перевищує ГДК ({gdkAvg})
            </Alert>
          )}

          <Form.Group className='mb-1'>
            <Form.Label>Введіть максимальне значення</Form.Label>
            <Form.Control
              type='number'
              min='0'
              value={valueMax}
              onChange={(e) => setMaxValue(+e.target.value)}
            />
          </Form.Group>
          {gdkMax > 0 && gdkMax < valueMax && (
            <Alert variant='danger'>
              Максимальне значення перевищує ГДК({gdkMax})
            </Alert>
          )}

          <Form.Group className='mb-1'>
            <Dropdown>
              <Dropdown.Toggle size='sm' variant='success'>
                {selectedElement.short_name}
              </Dropdown.Toggle>
              <Dropdown.Menu className='form-dropdown'>
                {elements.length > 0 &&
                  elements.map((element) => (
                    <Dropdown.Item
                      key={element.code}
                      onClick={() => selectElement(element)}
                    >
                      {element.short_name}
                    </Dropdown.Item>
                  ))}
              </Dropdown.Menu>
            </Dropdown>
          </Form.Group>

          {measure && (
            <Form.Group className='mb-1'>
              <Form.Label>Розмірність</Form.Label>
              <Form.Control type='input' disabled value={measure} />
            </Form.Group>
          )}
        </>
      )}
      {isLoading ? (
        <Button
          variant='outline-primary'
          onClick={handleSubmit}
          style={{
            cursor: 'not-allowed',
            pointerEvents: 'all',
          }}
          disabled
        >
          <Spinner
            as='span'
            animation='grow'
            size='sm'
            role='status'
            aria-hidden='true'
          />
          Обробка...
        </Button>
      ) : (
        <Button variant='outline-primary' onClick={handleSubmit}>
          Зберегти
        </Button>
      )}
    </>
  );
};
