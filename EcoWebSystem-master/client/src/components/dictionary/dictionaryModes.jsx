import React from 'react';
import { Form } from 'react-bootstrap';
import { DICTIONARY_MODES } from '../../utils/constants';

export const DictionaryModes = ({ selectedMode, setSelectedMode, user }) => {
  const modes = [
    {
      mode: DICTIONARY_MODES.search,
      displayName: 'Шукати',
      visible: true,
    },
    {
      mode: DICTIONARY_MODES.add,
      displayName: 'Додати',
      visible: user && user.id_of_expert === 0, // Адміністратор
    },
    {
      mode: DICTIONARY_MODES.edit,
      displayName: 'Редагувати',
      visible: user && user.id_of_expert === 0, // Адміністратор
    },
    {
      mode: DICTIONARY_MODES.delete,
      displayName: 'Видалити',
      visible: user && user.id_of_expert === 0, // Адміністратор
    },
  ];

  return (
    <Form.Group className='d-flex flex-column gap-3'>
      {modes
        .filter(({ visible }) => !!visible)
        .map(({ mode, displayName }) => (
          <Form.Check
            type='radio'
            id={mode}
            key={mode}
            label={displayName}
            value={selectedMode}
            name='mode'
            onClick={() => setSelectedMode(mode)}
          />
        ))}
    </Form.Group>
  );
};
