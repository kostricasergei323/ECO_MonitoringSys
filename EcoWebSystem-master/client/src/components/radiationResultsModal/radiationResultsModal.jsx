import React, { useEffect, useState } from 'react';
import { VerticallyCenteredModal } from '../modals/modal';
import { Tab, Tabs, Alert, Card } from 'react-bootstrap';
import { get } from '../../utils/httpService';
import { RADIATION_POINT_INFO_URL } from '../../utils/constants';
import { RadiationBar } from '../radiation-bar/radiation-bar';
import { AgGridReact } from 'ag-grid-react';

import { RadiationRiskRecommendations } from '../radiationRiskRecommendations/radiationRiskRecommendations';
import { mapColumns, mapRows } from '../radiation-tables/utils/mappers';
import { INHALATION_COLUMNS } from '../radiation-tables/inhalation/columns';
import { cardStyles } from '../submitRadiationForm/submitRadiationForm';
import { WATER_COLUMNS } from '../radiation-tables/water-table/columns';
import { PRODUCT_COLUMNS } from '../radiation-tables/products/columns';
import { SOIL_COLUMNS } from '../radiation-tables/soil/columns';
import { EXTERNAL_COLUMNS } from '../radiation-tables/external/columns';
import { RadiationBarComparison } from '../radiation-bar-comparison/radiation-bar-comparison';

const tabStyles = {
  height: '50vh',
};

const calculateTotalRisk = (radiationResults) => {
  return Object.values(radiationResults).reduce((acc, cur) => acc + cur, 0);
};

export const RadiationResultsModal = ({ id, onHide, show }) => {
  const [radiationResults, setRadiationResults] = useState({});
  const [radiationCalculations, setRadiationCalculations] = useState({});
  const [radiationObjectParameters, setRadiationObjectParameters] = useState(
    {}
  );

  const [totalRisk, setTotalRisk] = useState(0);

  useEffect(() => {
    get(`${RADIATION_POINT_INFO_URL}/${id}`).then(({ data }) => {
      setRadiationResults(data.results);
      setRadiationCalculations(data.calculations);
      setRadiationObjectParameters(data.radiationObjectParameters);
    });
  }, [id]);

  useEffect(() => {
    setTotalRisk(calculateTotalRisk(radiationResults));
  }, [radiationResults]);

  const shouldShowTable = (records) => {
    return records && records.length;
  };

  return (
    <VerticallyCenteredModal
      size='xl'
      show={show}
      onHide={onHide}
      header='Радіаційні ризики'
    >
      <Tabs>
        <Tab eventKey='radiationResults' title='Радіаційні разики'>
          <h2>Радіаційний ризик шляхом</h2>
          <Tabs>
            {radiationResults.inhalationResult && (
              <Tab
                eventKey='inhalationResult'
                title='Інгаляції'
                styles={tabStyles}
              >
                <Alert variant={'primary'}>
                  Радіаційний ризик шляхом інглаляції складає{' '}
                  {radiationResults.inhalationResult}
                </Alert>
                <RadiationBar
                  radiationRisk={radiationResults.inhalationResult}
                  title='Інгаляції'
                />
                {shouldShowTable(radiationCalculations.inhalationRecords) && (
                  <Card.Body
                    className='ag-theme-alpine'
                    style={{
                      ...cardStyles,
                      height: '200px',
                    }}
                  >
                    <AgGridReact
                      columnDefs={mapColumns(INHALATION_COLUMNS)}
                      rowSelection='single'
                      rowData={mapRows(radiationCalculations.inhalationRecords)}
                    />
                  </Card.Body>
                )}
                <RadiationRiskRecommendations
                  radiationRisk={radiationResults.inhalationResult}
                />
              </Tab>
            )}
            {radiationResults.waterResult && (
              <Tab eventKey='waterResult' title='Води' styles={tabStyles}>
                <Alert variant={'primary'}>
                  Радіаційний ризик шляхом вживання води складає{' '}
                  {radiationResults.waterResult}
                </Alert>
                <RadiationBar
                  radiationRisk={radiationResults.waterResult}
                  title='Води'
                />
                {shouldShowTable(radiationCalculations.waterRecords) && (
                  <Card.Body
                    className='ag-theme-alpine'
                    style={{
                      ...cardStyles,
                      height: '200px',
                    }}
                  >
                    <AgGridReact
                      columnDefs={mapColumns(WATER_COLUMNS)}
                      rowSelection='single'
                      rowData={mapRows(radiationCalculations.waterRecords)}
                    />
                  </Card.Body>
                )}
                <RadiationRiskRecommendations
                  radiationRisk={radiationResults.waterResult}
                />
              </Tab>
            )}
            {radiationResults.productResult && (
              <Tab
                eventKey='productResult'
                title='Продуктів'
                styles={tabStyles}
              >
                <Alert variant={'primary'}>
                  Радіаційний ризик шляхом вживання продуктів складає{' '}
                  {radiationResults.productResult}
                </Alert>
                <RadiationBar
                  radiationRisk={radiationResults.productResult}
                  title='Продуктів'
                />
                {shouldShowTable(radiationCalculations.productRecords) && (
                  <Card.Body
                    className='ag-theme-alpine'
                    style={{
                      ...cardStyles,
                      height: '200px',
                    }}
                  >
                    <AgGridReact
                      columnDefs={mapColumns(PRODUCT_COLUMNS)}
                      rowSelection='single'
                      rowData={mapRows(radiationCalculations.productRecords)}
                    />
                  </Card.Body>
                )}
                <RadiationRiskRecommendations
                  radiationRisk={radiationResults.productResult}
                />
              </Tab>
            )}
            {radiationResults.soilResult && (
              <Tab
                eventKey='soilResult'
                title='Вживання частинок грунту'
                styles={tabStyles}
              >
                <Alert variant={'primary'}>
                  Радіаційний ризик шляхом перорального вживання частинок грунту{' '}
                  {radiationResults.soilResult}
                </Alert>
                <RadiationBar
                  radiationRisk={radiationResults.soilResult}
                  title='Грунту'
                />
                {shouldShowTable(radiationCalculations.soilRecords) && (
                  <Card.Body
                    className='ag-theme-alpine'
                    style={{
                      ...cardStyles,
                      height: '200px',
                    }}
                  >
                    <AgGridReact
                      columnDefs={mapColumns(SOIL_COLUMNS)}
                      rowSelection='single'
                      rowData={mapRows(radiationCalculations.soilRecords)}
                    />
                  </Card.Body>
                )}
                <RadiationRiskRecommendations
                  radiationRisk={radiationResults.soilResult}
                />
              </Tab>
            )}
            {radiationResults.soilResult && (
              <Tab
                eventKey='externalResult'
                title='Зовнішнє опромінення від грунту'
                styles={tabStyles}
              >
                <Alert variant={'primary'}>
                  Радіаційний ризик шляхом зовнішнього опромінення від грунту{' '}
                  {radiationResults.externalResult}
                </Alert>
                <RadiationBar
                  radiationRisk={radiationResults.externalResult}
                  title='Зовнішнє від грунту'
                />
                {shouldShowTable(radiationCalculations.externalResult) && (
                  <Card.Body
                    className='ag-theme-alpine'
                    style={{
                      ...cardStyles,
                      height: '200px',
                    }}
                  >
                    <AgGridReact
                      columnDefs={mapColumns(EXTERNAL_COLUMNS)}
                      rowSelection='single'
                      rowData={mapRows(radiationCalculations.externalResult)}
                    />
                  </Card.Body>
                )}
                <RadiationRiskRecommendations
                  radiationRisk={radiationResults.externalResult}
                />
              </Tab>
            )}
            {Object.keys(radiationResults).length > 1 && (
              <Tab eventKey='comparison' title='Порівняння' styles={tabStyles}>
                <RadiationBarComparison radiationResults={radiationResults} />
              </Tab>
            )}
            {totalRisk && (
              <Tab
                eventKey='totalRisk'
                title='Сумарний ризик'
                styles={tabStyles}
              >
                <Alert variant={'primary'}>
                  Сумарний радіаційний ризик складає {totalRisk}
                </Alert>
                <RadiationBar
                  radiationRisk={totalRisk}
                  title='Сумарний ризик'
                />
                <RadiationRiskRecommendations radiationRisk={totalRisk} />
              </Tab>
            )}
          </Tabs>
        </Tab>
        {radiationObjectParameters.length && (
          <Tab eventKey='objectParameters' title='Дані об`єкту'>
            <Alert variant={'light'}>
              {radiationObjectParameters.map((data) => {
                return (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '20px',
                    }}
                  >
                    <div
                      style={{
                        width: '50%',
                        textAlign: 'right',
                        marginRight: '20px',
                      }}
                    >
                      <strong
                        style={{
                          marginRight: '5px',
                        }}
                      >
                        {data.description}
                      </strong>
                      {!!data.measure && <span>({data.measure})</span>}
                    </div>
                    <div
                      style={{
                        width: '50%',
                      }}
                    >
                      {data.value}
                    </div>
                  </div>
                );
              })}
            </Alert>
          </Tab>
        )}
      </Tabs>
    </VerticallyCenteredModal>
  );
};
