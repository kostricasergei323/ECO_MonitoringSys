import React, { useEffect, useState } from 'react';
import { Dropdown, Form, Tabs, Tab, Button, Spinner } from 'react-bootstrap';
import readXlsxFile from 'read-excel-file';

import { get, post } from '../../utils/httpService';
import { VerticallyCenteredModal } from '../modals/modal';
import {
  TYPE_OF_OBJECT_URL,
  OWNER_TYPES_URL,
  RADIATION_POINT_URL,
  RADIATION_POINT_INFO_URL,
  RADIATION_OBJECT_STATES_URL,
  ELEMENTS_URL,
} from '../../utils/constants';

import { SubmitRadiationForm } from '../submitRadiationForm/submitRadiationForm';
import {
  radiationRecordsInitialState,
  RadiationRecordsContext,
} from '../context/radiationRecordsContext';
import {
  RadiationObjectParametersContext,
  radiationObjectParametersInitialState,
} from '../context/radiationObjectParametersContext';
import { formatRecordsToDTO } from '../../utils/formatRecordsToDTO';
import {
  getUploadedFileType,
  uploadedFileTypes,
} from '../../utils/getFileType';
import {
  fillRadiationRecords,
  getXlsxMapUsingSheetName,
} from '../../utils/radiationPointImport';
import { RadiationObjectParameters } from '../radiationObjectParametersForm/radiationObjectParametersForm';

const now = new Date();
const year = now.getFullYear();
const month = ('0' + (now.getMonth() + 1)).slice(-2);
const day = ('0' + now.getDate()).slice(-2);

const initialState = {
  form: {
    date: `${year}-${month}-${day}`,
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
  records: [
    {
      inhalationRecords: [],
      waterRecords: [],
      productRecords: [],
      soilRecords: [],
      externalRecords: [],
    },
  ],
};

const emptyState = {
  typeOfObject: `Оберіть тип об'єкту`,
  ownerType: `Оберіть форму власності`,
};

export const AddRadiationPointModal = ({
  onHide,
  show,
  coordinates,
  pointId,
  setPointId,
  setShouldFetchData,
  user,
}) => {
  const [radiationRecords, setRadiationRecords] = useState(
    radiationRecordsInitialState
  );
  const [radiationObjectParameters, setRadiationObjectParameters] = useState(
    radiationObjectParametersInitialState
  );

  const [elements, setElements] = useState([]);
  const [radiationObjectStates, setRadiationObjectStates] = useState([]);
  const [name, setName] = useState(initialState.form.name);
  const [description, setDescription] = useState(initialState.form.description);
  const [type, setType] = useState(initialState.form.type);
  const [ownerType, setOwnerType] = useState(initialState.form.ownerType);
  const [types, setTypes] = useState([]);
  const [ownerTypes, setOwnerTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState(initialState.form.date);

  const clearForm = () => {
    setName(initialState.form.name);
    setDescription(initialState.form.description);
    setType(initialState.form.type);
    setOwnerType(initialState.form.ownerType);
    setRadiationRecords(radiationRecordsInitialState);
    setRadiationObjectParameters(radiationObjectParametersInitialState);
  };

  const hide = () => {
    clearForm();
    onHide();
  };

  const addRadiationPoint = () => {
    setIsLoading(true);
    const radiationRecordsDTO = formatRecordsToDTO(radiationRecords);
    const payload = {
      generalInfo: {
        Name_object: name,
        description,
        type: type.id,
        coordinates,
        id_of_user: user.id_of_user,
        owner_type_id: ownerType.id,
      },
      radiationEmissionsDate: date,
      radiationEmissions: radiationRecordsDTO,
      radiationObjectParameters: {
        commissioningDate: radiationObjectParameters.commissioningDate,
        stateId: radiationObjectParameters.state.id,
        equipmentDescription: radiationObjectParameters.equipmentDescription,
        generatingPower: radiationObjectParameters.generatingPower,
        fuelType: radiationObjectParameters.fuelType,
      },
    };
    console.log(payload);
    post(RADIATION_POINT_URL, payload)
      .then(() => {
        setShouldFetchData(true);
        alert('Радіаційний об`єкт успішно додано');
        hide();
        setIsLoading(false);
      })
      .catch((e) => {
        console.log(e);
        alert('Помилка при додаванні даних.');
        setShouldFetchData(false);
        setIsLoading(false);
      });
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
    get(ELEMENTS_URL).then(({ data }) => setElements(data));
    get(RADIATION_OBJECT_STATES_URL).then(({ data }) => {
      setRadiationObjectStates(data);
    });
  }, []);

  const handleDate = (date) => {
    if (new Date(date) > now) {
      setDate(`${year}-${month}-${day}`);
    } else {
      setDate(date);
    }
  };

  const disabled = () => {
    return (
      !radiationRecords.inhalationRecords.length &&
      !radiationRecords.waterRecords.length &&
      !radiationRecords.productRecords.length &&
      !radiationRecords.soilRecords.length &&
      !radiationRecords.externalRecords.length
    );
  };

  const fillGeneralInfo = (preloadedGeneralInfo) => {
    const { date, objectType, ownerType, name, description } =
      preloadedGeneralInfo;
    const formattedDate = `${date.getFullYear()}-${(
      '0' +
      (date.getMonth() + 1)
    ).slice(-2)}-${('0' + date.getDate()).slice(-2)}`;
    handleDate(formattedDate);
    const importedType = types.find(({ name }) => name === objectType);
    setType(importedType);
    const importedOwnerType = ownerTypes.find(({ type }) => type === ownerType);
    setOwnerType(importedOwnerType);
    setName(name);
    setDescription(description);
  };

  const fillRadiationObjectParameters = (preloadedData) => {
    const {
      state: importedStateName,
      generatingPower,
      equipmentDescription,
      commissioningDate,
      fuelType,
    } = preloadedData;
    const stateObject = radiationObjectStates.find(
      ({ state }) => state === importedStateName
    );
    const newRadiationObjectParameters = {
      generatingPower,
      state: stateObject,
      equipmentDescription,
      commissioningDate,
      fuelType,
    };
    setRadiationObjectParameters(newRadiationObjectParameters);
  };

  const fileUpload = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length) {
      try {
        const file = e.target.files[0];
        const type = getUploadedFileType(file);
        if (type === uploadedFileTypes.xlsx) {
          const sheets = (await readXlsxFile(file, { getSheets: true })).map(
            ({ name }) => name
          );
          let importedRadiationRecords = { ...radiationRecordsInitialState };
          for await (const sheet of sheets) {
            const map = getXlsxMapUsingSheetName(sheet);
            const data = await readXlsxFile(file, { sheet, map });
            if (sheet === 'Sheet1' || sheet === 'GeneralInfo') {
              fillGeneralInfo(data.rows[0]);
            } else if (
              sheet === 'Sheet2' ||
              sheet === 'RadiationObjectParameters'
            ) {
              fillRadiationObjectParameters(data.rows[0]);
            } else {
              const mapped = data.rows.map((row) => {
                const { elementName, index, ...rest } = row;
                return {
                  ...rest,
                  element: elements.find(
                    ({ short_name }) => short_name === elementName
                  ),
                };
              });
              importedRadiationRecords = fillRadiationRecords(
                sheet,
                mapped,
                importedRadiationRecords
              );
            }
          }
          const newInhalationRecords = [
            ...radiationRecords.inhalationRecords,
            ...importedRadiationRecords.inhalationRecords,
          ];
          const newWaterRecords = [
            ...radiationRecords.waterRecords,
            ...importedRadiationRecords.waterRecords,
          ];
          const newProductRecords = [
            ...radiationRecords.productRecords,
            ...importedRadiationRecords.productRecords,
          ];
          const newSoilRecords = [
            ...radiationRecords.soilRecords,
            ...importedRadiationRecords.soilRecords,
          ];
          const newExternalRecords = [
            ...radiationRecords.externalRecords,
            ...importedRadiationRecords.externalRecords,
          ];
          setRadiationRecords({
            inhalationRecords: newInhalationRecords,
            waterRecords: newWaterRecords,
            productRecords: newProductRecords,
            soilRecords: newSoilRecords,
            externalRecords: newExternalRecords,
          });
        }
      } catch (error) {
        alert('Помилка при обробці вхідних даних');
      }
    }
  };

  return (
    <VerticallyCenteredModal
      size='xl'
      style={{
        maxWidth: 'initial',
        width: '90vw',
      }}
      show={show}
      onHide={() => hide()}
      header={'Додати радіаційний обєкт'}
    >
      <RadiationRecordsContext.Provider
        value={{ radiationRecords, setRadiationRecords }}
      >
        <RadiationObjectParametersContext.Provider
          value={{ radiationObjectParameters, setRadiationObjectParameters }}
        >
          <Form
            style={{
              maxHeight: '99vh',
              overflow: 'auto',
              padding: '0 10px',
            }}
          >
            <Form.Group>
              <div>Зчитати дані з листа Excel</div>
              <input
                type='file'
                accept='.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/plain'
                onChange={(e) => fileUpload(e)}
              />
            </Form.Group>
            <Tabs
              defaultActiveKey='general'
              id='uncontrolled-tab-example'
              style={{
                padding: '10px 0',
              }}
            >
              <Tab eventKey='general' title='Загальні дані'>
                <Form.Group>
                  <Form.Label>Оберіть дату викидів</Form.Label>
                  <Form.Control
                    type='date'
                    value={date}
                    onChange={(e) => handleDate(e.target.value)}
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
                  <Form.Label>Введіть імʼя обʼєкту</Form.Label>
                  <Form.Control
                    type='input'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Введіть опис обʼєкту</Form.Label>
                  <Form.Control
                    as='textarea'
                    rows='3'
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Form.Group>
              </Tab>
              <Tab
                eventKey='radiationObjectParameters'
                title='Параметри об`єкта'
              >
                <RadiationObjectParameters
                  radiationObjectStates={radiationObjectStates}
                />
              </Tab>
              <Tab eventKey='emissions' title='Радіаційні показники'>
                <SubmitRadiationForm elements={elements} />
              </Tab>
            </Tabs>
            {isLoading ? (
              <Button
                variant='outline-primary'
                onClick={addRadiationPoint}
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
              <Button
                variant='outline-primary'
                onClick={addRadiationPoint}
                disabled={disabled()}
              >
                Зберегти
              </Button>
            )}
          </Form>
        </RadiationObjectParametersContext.Provider>
      </RadiationRecordsContext.Provider>
    </VerticallyCenteredModal>
  );
};
