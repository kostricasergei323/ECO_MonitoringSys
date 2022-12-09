import React from 'react';
import { Table } from 'react-bootstrap';

import { get } from '../../utils/httpService';
import { FORMULA_CALCULATIONS_URL } from '../../utils/constants';
import { transformCalculationDate } from '../../utils/helpers';

import '../charts/emissionsChartModal.css';

export const FormulaCalculationsInfo = ({ id }) => {
  const [loaded, setLoaded] = React.useState(false);

  const [data, setData] = React.useState([]);

  React.useEffect(() => {
    if (!loaded) {
      get(`${FORMULA_CALCULATIONS_URL}/${id}`)
        .then(({ data }) => {
          setData(data);
          setLoaded(true);
        })
        .catch((err) => {
          console.log('Error loading data');
        });
    }
  });

  return (
    <>
      {data.length > 0 ? (
        <div className='emission-table-wraper'>
          <Table className='emissions-inner-table'>
            <thead>
              <tr>
                <th title='Серія'>Серія</th>
                <th title='Дата'>Дата</th>
                <th title='Назва формули'>Назва формули</th>
                <th title='Результат'>Результат</th>
              </tr>
            </thead>
            <tbody>
              {data.map((el, id) => {
                return (
                  <tr key={id}>
                    <td title={el.name}>{el.name}</td>
                    <td title={transformCalculationDate(new Date(el.date))}>
                      {transformCalculationDate(new Date(el.date))}
                    </td>
                    <td title={el.formula}>{el.formula}</td>
                    <td title={el.result}>{el.result}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <h4 style={{ textAlign: 'center', marginTop: 10, marginBottom: 10 }}>
          Для цього об'єкту не розраунків не знайдено!
        </h4>
      )}
    </>
  );
};
