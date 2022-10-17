import React, { useEffect, useState } from 'react';

import { InputGroup, FormControl, Button, Table } from 'react-bootstrap';

import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-alpine.css';

import { URL_FROM_TABLE_NAME_MAP } from '../../utils/maps';
import { get } from '../../utils/httpService';

import { AddDictionaryRecord } from '../addComponents/addDictionaryRecord';
import { DictionaryModes } from './dictionaryModes';
import { DICTIONARY_MODES, TABLE_NAMES } from '../../utils/constants';
import { RemoveDictionaryRecord } from './removeDictionaryRecord';
import { EditDictionaryRecord } from './editDictionaryRecord';
import dicLegend from '../../utils/dictionaryLegend.json';

import './dictionary.css';
import { useMemo } from 'react';

const mapColumns = (columns) => {
  return columns.map((columnName) => ({
    headerName: columnName,
    field: columnName,
    sortable: true,
    filter: true,
  }));
};

export const Dictionary = ({ user, tableName }) => {
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);

  const [shouldFetchData, setShouldFetchData] = useState(true);

  const url = useMemo(() => {
    setShouldFetchData(true);
    return URL_FROM_TABLE_NAME_MAP.get(
      tableName !== '' ? tableName.toLowerCase() : TABLE_NAMES.elements
    );
  }, [tableName]);

  const [gridOptions, setGridOptions] = useState({});

  const [selectedMode, setSelectedMode] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [shouldDeselectSelectedRows, setShouldDeselectSelectedRows] =
    useState(false);

  useEffect(() => {
    if (shouldFetchData) {
      get(url).then(({ data }) => {
        const mappedColumns = mapColumns(Object.keys(data[0]));
        setColumns(mappedColumns);
        setRows(Object.values(data));
      });

      setShouldFetchData(false);
    }
  }, [url, shouldFetchData]);

  useEffect(() => {
    if (shouldDeselectSelectedRows && gridOptions.api) {
      setSelectedRow(null);
      gridOptions.api.deselectAll();
      onFilterTextBoxChanged('');

      setShouldDeselectSelectedRows(false);
    }
  }, [shouldDeselectSelectedRows, gridOptions.api]);

  useEffect(() => {
    setShouldDeselectSelectedRows(true);
  }, [selectedMode]);

  const onFilterTextBoxChanged = (inputText) => {
    gridOptions.api.setQuickFilter(inputText);
  };

  const onGridReady = (gridOptions) => {
    setGridOptions(gridOptions);
  };

  const onRowSelected = () => {
    const selectedNodes = gridOptions.api.getSelectedNodes();
    const selectedData = selectedNodes.map(({ data }) => data);

    setSelectedRow(selectedData[0]);
  };

  const exportDataAsCSV = () => {
    const params = {
      fileName: 'exportingData.csv',
    };

    gridOptions.api.exportDataAsCsv(params);
  };

  return (
    <>
      <div className='container d-flex justify-content-space-between mt-4 mb-4 dictionary'>
        <div className='col-3 ps-3 text-left dictionary__modes'>
          <div className='mb-2'>Оберіть дію:</div>
          <DictionaryModes
            setSelectedMode={setSelectedMode}
            selectedMode={selectedMode}
            user={user}
            className='text-align-left'
          />
          <Button
            variant='secondary'
            className='mt-3'
            onClick={exportDataAsCSV}
          >
            Експорт у CSV
          </Button>
        </div>
        <div
          className='col-9'
          style={{
            backgroundColor: '#e1ebf3',
            paddingTop: '10px',
            paddingBottom: '10px',
          }}
        >
          {selectedMode === DICTIONARY_MODES.search && (
            <div className='row'>
              <InputGroup size='md' className='col-9 m-auto w-75'>
                <InputGroup.Text id='inputGroup-sizing-md'>
                  Пошук:
                </InputGroup.Text>
                <FormControl
                  aria-label='Medium'
                  aria-describedby='inputGroup-sizing-md'
                  id='filter-text-box'
                  placeholder='Введіть пошукові дані...'
                  onInput={({ target }) =>
                    onFilterTextBoxChanged(target?.value ?? '')
                  }
                />
              </InputGroup>
            </div>
          )}
          {user &&
            user.id_of_expert === 0 &&
            selectedMode === DICTIONARY_MODES.add && (
              <AddDictionaryRecord
                columns={columns}
                url={url}
                setShouldFetchData={setShouldFetchData}
              />
            )}
          {user &&
            user.id_of_expert === 0 &&
            selectedMode === DICTIONARY_MODES.edit && (
              <EditDictionaryRecord
                columns={columns}
                url={url}
                setShouldFetchData={setShouldFetchData}
                selectedRow={selectedRow}
                setShouldDeselectSelectedRows={setShouldDeselectSelectedRows}
              />
            )}
          {user &&
            user.id_of_expert === 0 &&
            selectedMode === DICTIONARY_MODES.delete && (
              <RemoveDictionaryRecord
                selectedRow={selectedRow}
                url={url}
                setShouldFetchData={setShouldFetchData}
                setShouldDeselectSelectedRows={setShouldDeselectSelectedRows}
              />
            )}
        </div>
      </div>
      <div
        style={{ height: '500px', width: '99%', margin: '0 auto' }}
        className='ag-theme-alpine'
      >
        <Table className='ColumnLegend' responsive size='lg'>
          <tbody>
            <tr>
              <th title='Абревіатура'> Абревіатура </th>
              {columns.map((el, i) => {
                return (
                  <td key={el + i} title={el.headerName}>
                    {' '}
                    {el.headerName}{' '}
                  </td>
                );
              })}
            </tr>
            <tr>
              <th title='Визначення'> Визначення </th>
              {columns.map((el, i) => {
                let foundTable = dicLegend.find(
                  (el2) => el2.table == tableName.toLowerCase()
                );
                let found = foundTable
                  ? foundTable.names.find(
                      (el2) => el2.initName == el.headerName
                    )
                  : undefined;
                if (found === undefined) {
                  return (
                    <td key={el + i} title='Не знайдено опис'>
                      {' '}
                      Не знайдено опис{' '}
                    </td>
                  );
                }

                return (
                  <td key={el + i} title={found.newName}>
                    {' '}
                    {found.newName}{' '}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </Table>

        <AgGridReact
          columnDefs={columns}
          rowData={rows}
          rowSelection='single'
          onGridReady={onGridReady}
          onRowSelected={onRowSelected}
        />
      </div>
    </>
  );
};
