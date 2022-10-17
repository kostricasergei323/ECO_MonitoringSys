import React, { useState } from 'react';
import { SketchPicker } from 'react-color';
import { Form } from 'react-bootstrap';
import readXlsxFile from 'read-excel-file';

import { post, get, put } from '../../utils/httpService';
import { POLYGON_URL } from '../../utils/constants';

import { VerticallyCenteredModal } from '../modals/modal';
import { SubmitForm } from '../submitForm/submitForm';
import { useEffect } from 'react';
import { extractRGBA } from '../../utils/helpers';
import {
  getUploadedFileType,
  uploadedFileTypes,
} from '../../utils/getFileType';
import { preparedDataPromise } from '../../utils/txtFilesService';

const initialState = {
  form: {
    brushColor: {
      r: 0,
      g: 0,
      b: 0,
      a: 1,
    },
    lineThickness: 1,
    name: '',
    type: 'polygon',
    description: '',
  },
  preloadedEmission: null,
};

export const AddPolygonModal = ({
  onHide,
  show,
  coordinates,
  setShouldFetchData,
  setNewPolygonCoordinates,
  user,
  isEditPolygonMode,
  setIsEditPolygonMode,
  polygonId,
  setPolygonId,
}) => {
  const [lineThickness, setLineThickness] = useState(
    initialState.form.lineThickness
  );
  const [color, setColor] = useState(initialState.form.brushColor);
  const [name, setName] = useState(initialState.form.name);
  const [description, setDescription] = useState(initialState.form.description);
  const [preloadedEmission, setPreloadedEmission] = useState(
    initialState.preloadedEmission
  );

  const [isLoading, setIsLoading] = useState(false);

  const clearForm = () => {
    setLineThickness(initialState.form.lineThickness);
    setColor(initialState.form.brushColor);
    setName(initialState.form.name);
    setDescription(initialState.form.description);
    setPreloadedEmission(initialState.preloadedEmission);
    setIsEditPolygonMode(false);
    setPolygonId(null);
  };

  useEffect(() => {
    if (polygonId && isEditPolygonMode) {
      get(`${POLYGON_URL}/${polygonId}`).then(({ data }) => {
        setLineThickness(data.line_thickness);
        setColor({
          r: data.brush_color_r,
          g: data.bruch_color_g,
          b: data.brush_color_b,
          a: data.brush_alfa,
        });
        setName(data.name);
        setDescription(data.description);
      });
    }
  }, [polygonId, isEditPolygonMode]);

  const addPolygon = (emission) => {
    setIsLoading(true);
    post(POLYGON_URL, {
      brush_color_r: color.r,
      bruch_color_g: color.g,
      brush_color_b: color.b,
      brush_alfa: color.a,
      line_collor_r: color.r,
      line_color_g: color.g,
      line_color_b: color.b,
      line_alfa: color.a,
      line_thickness: Number(lineThickness),
      name,
      id_of_user: Number(user.id_of_user),
      type: initialState.form.type,
      description,
      points: coordinates.map((point, index) => ({
        latitude: point.lat,
        longitude: point.lng,
        order123: index + 1,
      })),
      emission,
    })
      .then(() => {
        clearForm();
        onHide();
        setNewPolygonCoordinates([]);
        setShouldFetchData(true);
        setIsLoading(false);
      })
      .catch((error) => {
        alert('Помилка при додаванні даних.');
        console.log(error);
        setNewPolygonCoordinates([]);
        setShouldFetchData(false);
        setIsLoading(false);
      });
  };

  const editPolygon = (emission) => {
    setIsLoading(true);
    put(`${POLYGON_URL}/${polygonId}`, {
      brush_color_r: color.r,
      bruch_color_g: color.g,
      brush_color_b: color.b,
      brush_alfa: color.a,
      line_collor_r: color.r,
      line_color_g: color.g,
      line_color_b: color.b,
      line_alfa: color.a,
      line_thickness: Number(lineThickness),
      name,
      description,
      emission,
    })
      .then(() => {
        clearForm();
        onHide();
        setNewPolygonCoordinates([]);
        setShouldFetchData(true);
        setIsEditPolygonMode(false);
        setPolygonId(null);
        setIsLoading(false);
      })
      .catch((error) => {
        alert('Помилка при редагуванні даних.');
        console.log(error);
        setIsEditPolygonMode(false);
        setPolygonId(null);
        setNewPolygonCoordinates([]);
        setShouldFetchData(false);
        setIsLoading(false);
      });
  };

  const hide = () => {
    clearForm();
    onHide();
  };

  const setModalFields = (rows) => {
    let preloadedEmission = null;

    const actionsMap = new Map([
      ['LINE_THICKNESS', (columnValue) => setLineThickness(columnValue)],
      ['COLOR', (columnValue) => setColor(extractRGBA(columnValue))],
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

  return (
    <VerticallyCenteredModal
      size='lg'
      show={show}
      onHide={() => hide()}
      header={isEditPolygonMode ? 'Редагувати полігон' : 'Додати полігон'}
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
          <Form.Label>Оберіть колір полігона та товщину лінії</Form.Label>
          <Form.Control
            type='number'
            value={lineThickness}
            min={1}
            onChange={(e) => setLineThickness(e.target.value)}
          />
          <br />
          <SketchPicker
            color={color}
            onChangeComplete={({ rgb }) => setColor(rgb)}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Введіть ім'я полігону</Form.Label>
          <Form.Control
            type='input'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Додайте опис полігону</Form.Label>
          <Form.Control
            as='textarea'
            rows='3'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Form.Group>
        {isEditPolygonMode ? (
          <SubmitForm
            onSave={editPolygon}
            preloadedEmission={preloadedEmission}
            isLoading={isLoading}
          />
        ) : (
          <SubmitForm
            onSave={addPolygon}
            preloadedEmission={preloadedEmission}
            isLoading={isLoading}
          />
        )}
      </Form>
    </VerticallyCenteredModal>
  );
};
