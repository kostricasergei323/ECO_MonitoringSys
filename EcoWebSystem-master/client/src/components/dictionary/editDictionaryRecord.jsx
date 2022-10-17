import React from 'react';
import { Button, Form, Alert } from 'react-bootstrap';

import { put } from '../../utils/httpService';
import { getIdColumnNameForDictionaryObject } from '../../utils/helpers';

const getInitialState = (columns, selectedRow) => {
  return columns
    .map(({ field }) => field)
    .reduce((o, key) => ({ ...o, [key]: selectedRow[key] }), {});
};

const ExceptionColumns = [{ '/gdk': ['EnvironmentName', 'CodeName'] }];

export const EditDictionaryRecord = ({
  columns,
  url,
  setShouldFetchData,
  selectedRow,
  setShouldDeselectSelectedRows,
}) => {
  let Obj = Object.values(ExceptionColumns).find(
    (x) => Object.keys(x)[0] == url
  );
  if (Obj) {
    for (const itr of columns) {
      if (Obj[url].indexOf(itr.headerName) != -1) {
        columns = columns.splice(columns.indexOf(itr), 1);
      }
    }
  }

  const [formValues, setFormValues] = React.useState({});

  React.useEffect(() => {
    if (selectedRow) {
      setFormValues(getInitialState(columns, selectedRow));
    }
  }, [columns, selectedRow]);

  const setForm = (field, value) => {
    setFormValues({ ...formValues, [field]: value });
  };

  const editRecord = async () => {
    const idColumnName = getIdColumnNameForDictionaryObject(selectedRow);
    const idValue = selectedRow[idColumnName];
    try {
      await put(`${url}/${idValue}`, formValues);
      setShouldFetchData(true);
      setShouldDeselectSelectedRows(true);
      alert('Рядок успішно змінено');
    } catch (error) {
      console.log(error.response);
      alert('Помилка видалення');
      const message = error.response.data.message;
      alert(message ? message.sqlMessage : message.toString());
    }
  };

  return (
    <>
      {selectedRow ? (
        <>
          <Form
            style={{
              margin: '0 auto',
              width: '80%',
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            {columns &&
              columns.map(({ field }) => (
                <Form.Group
                  style={{ padding: '0 10px', width: '50%' }}
                  key={field}
                >
                  <Form.Label>{field}</Form.Label>
                  <Form.Control
                    type='input'
                    placeholder={`Введіть значення для ${field}`}
                    value={formValues[field] ?? ''}
                    onChange={(e) => setForm(field, e.target.value)}
                  />
                </Form.Group>
              ))}
          </Form>
          {columns.length > 0 && (
            <Button variant='primary' onClick={editRecord} className='mb-3'>
              Редагувати
            </Button>
          )}
        </>
      ) : (
        <Alert className='m-auto' variant='primary'>
          Оберіть рядок для редагування
        </Alert>
      )}
    </>
  );
};
