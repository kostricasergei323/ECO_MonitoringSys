import React, { useEffect, useState } from 'react';
import { Dropdown, Form } from 'react-bootstrap';
import readXlsxFile from 'read-excel-file';

import { TYPE_OF_OBJECT_URL, OWNER_TYPES_URL } from '../../utils/constants';
import { post, get, put } from '../../utils/httpService';
import { POINT_URL } from '../../utils/constants';
import {
  getUploadedFileType,
  uploadedFileTypes,
} from '../../utils/getFileType';
import { preparedDataPromise } from '../../utils/txtFilesService';

import { VerticallyCenteredModal } from '../modals/modal';
import { SubmitForm } from '../submitForm/submitForm';

import '../submitForm/submitForm.css';

const initialState = {
  form: {
    name: '',
    description: '',
    type: {
      id: 0,
      name: '',
    },
    ownerType: {
      id: 0,
      type: '',
    },
  },
  preloadedEmission: null,
};

const emptyState = {
  typeOfObject: `Оберіть тип об'єкту`,
  ownerType: `Оберіть форму власності`,
};

export const AddPointModal = ({
  onHide,
  show,
  coordinates,
  setShouldFetchData,
  isEditPointMode,
  setIsEditPointMode,
  pointId,
  setPointId,
  user,
}) => {
  const [name, setName] = useState(initialState.form.name);
  const [description, setDescription] = useState(initialState.form.description);
  const [type, setType] = useState(initialState.form.type);
  const [ownerType, setOwnerType] = useState(initialState.form.ownerType);
  const [types, setTypes] = useState([]);
  const [ownerTypes, setOwnerTypes] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const [preloadedEmission, setPreloadedEmission] = useState(
    initialState.preloadedEmission
  );

  const clearForm = () => {
    setName(initialState.form.name);
    setDescription(initialState.form.description);
    setType(initialState.form.type);
    setOwnerType(initialState.form.ownerType);
    setPreloadedEmission(initialState.preloadedEmission);
    setIsEditPointMode(false);
    setPointId(null);
  };

  const addPoint = (emission) => {
    setIsLoading(true);
    post(POINT_URL, {
      Name_object: name,
      description,
      type: type.id,
      coordinates,
      emission,
      id_of_user: user.id_of_user,
      owner_type_id: ownerType.id,
    })
      .then(() => {
        clearForm();
        onHide();
        setShouldFetchData(true);
        setIsLoading(false);
      })
      .catch((error) => {
        alert('Помилка при додаванні даних.');
        console.log(error);
        setShouldFetchData(false);
        setIsLoading(false);
      });
  };

  const editPoint = (emission) => {
    setIsLoading(true);
    put(`${POINT_URL}/${pointId}`, {
      Name_object: name,
      description,
      type: type.id,
      owner_type_id: ownerType.id,
      emission,
    })
      .then(() => {
        clearForm();
        onHide();
        setShouldFetchData(true);
        setIsEditPointMode(false);
        setPointId(null);
        setIsLoading(false);
      })
      .catch((error) => {
        alert('Помилка при редагуванні даних.');
        console.log(error);
        setShouldFetchData(false);
        setIsEditPointMode(false);
        setPointId(null);
        setIsEditPointMode(false);
        setPointId(null);
        setIsLoading(false);
      });
  };

  const hide = () => {
    clearForm();
    onHide();
  };

  useEffect(() => {
    get(TYPE_OF_OBJECT_URL).then(({ data }) => {
      const mappedTypes = data.map(({ Id, Name, Image_Name }) => ({
        id: Id,
        name: Name,
        imageName: Image_Name,
      }));

      setTypes(mappedTypes);
    });
    get(OWNER_TYPES_URL).then(({ data }) => {
      setOwnerTypes(data);
    });
  }, []);

  useEffect(() => {
    if (isEditPointMode && pointId) {
      get(`${POINT_URL}/${pointId}`).then(({ data }) => {
        const type = types.find(({ id }) => id === data.type);
        const ownerType = ownerTypes.find(
          ({ id }) => id === data.owner_type.id
        );
        if (type) {
          setType(type);
        }
        if (ownerType) {
          setOwnerType(ownerType);
        }
        setName(data.Name_object);
        setDescription(data.description);
      });
    }
  }, [pointId, isEditPointMode]);

  const fileUpload = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length) {
      try {
        const type = getUploadedFileType(e.target.files[0]);
        if (type === uploadedFileTypes.txt) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const mappedResult = await preparedDataPromise(e.target.result);
            setModalFields(mappedResult);
          };
          reader.readAsText(e.target.files[0], 'UTF-8');
        } else if (type === uploadedFileTypes.xlsx) {
          const data = await readXlsxFile(e.target.files[0]);
          setModalFields(data);
        }
      } catch (error) {
        alert('Помилка при обробці вхідних даних');
      }
    }
  };

  const setModalFields = (rows) => {
    let preloadedEmission = null;

    const actionsMap = new Map([
      [
        'OBJECT_TYPE',
        (columnValue) => {
          const type = types.find(({ name }) => name === columnValue);
          setType(type);
        },
      ],
      [
        'OWNER_TYPE',
        (columnValue) => {
          const type = ownerTypes.find(({ type }) => type === columnValue);
          setOwnerType(type);
        },
      ],
      ['NAME', (columnValue) => setName(columnValue)],
      ['DESCRIPTION', (columnValue) => setDescription(columnValue)],
      [
        'DATE',
        (columnValue) =>
          (preloadedEmission = { ...preloadedEmission, date: columnValue }),
      ],
      [
        'ELEMENT',
        (columnValue) =>
          (preloadedEmission = {
            ...preloadedEmission,
            elementName: columnValue,
          }),
      ],
      [
        'AVERAGE_VALUE',
        (columnValue) =>
          (preloadedEmission = {
            ...preloadedEmission,
            averageValue: columnValue,
          }),
      ],
      [
        'MAXIMUM_VALUE',
        (columnValue) =>
          (preloadedEmission = {
            ...preloadedEmission,
            maximumValue: columnValue,
          }),
      ],
    ]);

    try {
      rows.forEach(([columnName, columnValue]) =>
        actionsMap.get(columnName)(columnValue)
      );

      setPreloadedEmission(preloadedEmission);
    } catch (error) {
      alert('Помилка. Неправильні дані');
      console.error(error);
    }
  };

  return (
    <VerticallyCenteredModal
      size='lg'
      show={show}
      onHide={() => hide()}
      header={isEditPointMode ? 'Редагувати маркер' : 'Додати маркер'}
    >
      <Form>
        <Form.Group>
          <div>Зчитати дані з листа Excel або текстового файла</div>
          <input
            type='file'
            accept='.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/plain'
            onChange={(e) => fileUpload(e)}
          />
        </Form.Group>

        <Form.Group>
          <Dropdown>
            <Dropdown.Toggle size='sm' variant='success'>
              {type.name || emptyState.typeOfObject}
            </Dropdown.Toggle>

            <Dropdown.Menu className='form-dropdown'>
              {types.length &&
                types.map((typeOfObject) => (
                  <Dropdown.Item
                    key={typeOfObject.id}
                    active={typeOfObject === type}
                    onClick={() => setType(typeOfObject)}
                  >
                    {typeOfObject.name}
                  </Dropdown.Item>
                ))}
            </Dropdown.Menu>
          </Dropdown>
        </Form.Group>

        <Form.Group>
          <Dropdown>
            <Dropdown.Toggle size='sm' variant='success'>
              {ownerType.type || emptyState.ownerType}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              {ownerTypes.length &&
                ownerTypes.map((type) => (
                  <Dropdown.Item
                    key={type.id}
                    active={type === ownerType}
                    onClick={() => setOwnerType(type)}
                  >
                    {type.type}
                  </Dropdown.Item>
                ))}
            </Dropdown.Menu>
          </Dropdown>
        </Form.Group>

        <Form.Group>
          <Form.Label>Введіть імʼя</Form.Label>
          <Form.Control
            type='input'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Введіть опис</Form.Label>
          <Form.Control
            as='textarea'
            rows='3'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Form.Group>

        {isEditPointMode ? (
          <SubmitForm
            onSave={editPoint}
            preloadedEmission={preloadedEmission}
            isLoading={isLoading}
          />
        ) : (
          <SubmitForm
            onSave={addPoint}
            preloadedEmission={preloadedEmission}
            isLoading={isLoading}
          />
        )}
      </Form>
    </VerticallyCenteredModal>
  );
};
