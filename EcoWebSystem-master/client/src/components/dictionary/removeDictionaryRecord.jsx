import React from 'react';
import { InputGroup, FormControl, Button, Alert } from 'react-bootstrap';
import { getIdColumnNameForDictionaryObject } from '../../utils/helpers';
import { useEffect } from 'react';
import { useState } from 'react';
import { deleteRequest } from '../../utils/httpService';

export const RemoveDictionaryRecord = ({
  selectedRow,
  setShouldDeselectSelectedRows,
  url,
  setShouldFetchData,
}) => {
  const [idColumnName, setIdColumnName] = useState(null);
  const [idValue, setIdValue] = useState(null);

  useEffect(() => {
    if (selectedRow) {
      const idColumnName = getIdColumnNameForDictionaryObject(selectedRow);
      setIdColumnName(idColumnName);

      const idValue = selectedRow[idColumnName];
      setIdValue(idValue);
    }
  }, [selectedRow]);

  const removeRecord = async () => {
    const warningMessage = `
    Ви впевнені що бажаєте видалити обраний рядок?
    Для підтверждення операції введіть: ${idValue}`;
    const userConfirmation = window.prompt(warningMessage);

    if (+userConfirmation === idValue) {
      try {
        await deleteRequest(`${url}/${idValue}`);
        setShouldFetchData(true);
        setShouldDeselectSelectedRows(true);
        alert('Рядок успішно видалено');
      } catch (error) {
        console.log(error.response);
        alert('Помилка видалення');
        const message = error.response.data.message;
        alert(message ? message.sqlMessage : message.toString());
      }
    } else {
      alert(
        'Невірно введене підтвердження або була відміна операції. Операцію скасовано.'
      );
    }
  };

  return (
    <div>
      {!selectedRow && (
        <Alert variant='primary'>Оберіть рядок для видалення</Alert>
      )}
      {selectedRow && (idValue || idValue === 0) && idColumnName && (
        <div className='d-flex justify-content-center flex-column'>
          <InputGroup size='md'>
            <InputGroup.Text id='inputGroup-sizing-md'>
              Видалити {idColumnName}:
            </InputGroup.Text>
            <FormControl
              aria-label='Medium'
              aria-describedby='inputGroup-sizing-md'
              id='filter-text-box'
              placeholder='Оберіть рядок для видалення...'
              disabled
              value={idValue}
            />
          </InputGroup>
          <div className='col-1 me-auto ms-auto mb-3 mt-3'>
            <Button variant='danger' onClick={removeRecord}>
              Видалити
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
