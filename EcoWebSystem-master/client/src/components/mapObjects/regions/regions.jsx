import React, { useEffect, useState, useContext } from 'react';
import { Popup, Polygon } from 'react-leaflet';

import { REGIONS_URL } from '../../../utils/constants';
import { get } from '../../../utils/httpService';
import { CountData } from '../../../utils/regionsCounter';

import { Dropdown, DropdownButton, Button, Table } from 'react-bootstrap';
import { RegionMedStatModal } from '../../medStat/regionMedStatModal';
import { EmissionsChartModal } from '../../charts/emissionsChartModal';

import { EnvironmentsInfoContext } from '../../context/environmentsInfoContext';

import '../popup.css';

const ReturnLastData = ({ emissions }) => {
  let arr = emissions.slice();
  if (arr.length >= 4) {
    arr = arr.slice(0, 4).reverse();
  }

  return arr.map(
    ({ short_name, ValueAvg, ValueMax, Year, Month, day, Measure }, key) => (
      <tr key={key}>
        <td title={short_name}>{short_name}</td>
        <td title={ValueAvg}>{ValueAvg}</td>
        <td title={ValueMax}>{ValueMax}</td>
        <td title={Year}>{Year}</td>
        <td title={Month}>{Month}</td>
        <td title={day}>{day}</td>
        <td title={Measure}>{Measure}</td>
      </tr>
    )
  );
};

const Region = ({
  regionId,
  regionPoints,
  lineThickness,
  name,
  emissions,
  idEnvironment,
  AttachedEmmissions,
  user_name,
  EnvironmentAttachment,
}) => {
  const [Emmissions, setEmmissions] = useState(AttachedEmmissions);
  const [DetailedModalShow, setDetailedModalShow] = useState(false);
  const [modalShow, setModalShow] = useState(false);
  const [CountedData, setCountedData] = useState([]);

  const [chosenData, setChosenData] = useState(null);
  const user = JSON.parse(sessionStorage.getItem('user'));

  useEffect(() => {
    setEmmissions(AttachedEmmissions);
  }, [AttachedEmmissions]);

  useEffect(() => {
    if (CountedData?.length > 0) {
      setChosenData(
        CountedData.reduce((el, curr) =>
          el.res.res.lvl > curr.res.res.lvl ? el : curr
        )
      );
    }
  }, [CountedData]);

  useEffect(() => {
    setCountedData(CountData(idEnvironment, Emmissions));
  }, [Emmissions]);

  return (
    <Polygon
      positions={regionPoints}
      weight={lineThickness}
      color={chosenData?.res ? chosenData.res.res.color : 'grey'}
      fillOpacity={0.3}
    >
      <Popup
        maxWidth={window.innerWidth >= 991 ? 'auto' : window.innerWidth / 1.2}
      >
        <div className='mt-4 mb-2'>
          {name && (
            <div>
              <strong>Назва:</strong> {name}
            </div>
          )}
          {user_name && (
            <div>
              <strong>Експерт який поставив:</strong> {user_name}
            </div>
          )}
        </div>
        {emissions && emissions.length > 0 && (
          <>
            <div className='emissions-container'>
              <Table
                striped
                bordered
                hover
                size='sm'
                className='emissions-table'
              >
                <thead>
                  <tr>
                    <th title='Хімічний елемент'>Хімічний елемент</th>
                    <th title='Середнє значення'>Середнє значення</th>
                    <th title='Максимальне значення'>Максимальне значення</th>
                    <th title='Рік'>Рік</th>
                    <th title='Місяць'>Місяць</th>
                    <th title='День'>День</th>
                    <th title='Одиниця виміру'>Одиниця виміру</th>
                  </tr>
                </thead>
                <tbody>
                  <ReturnLastData emissions={emissions} />
                </tbody>
              </Table>
            </div>
            <Button size='sm' onClick={() => setDetailedModalShow(true)}>
              Відобразити графіки викидів
            </Button>
            <EmissionsChartModal
              id={regionId}
              emissions={emissions}
              show={DetailedModalShow}
              onHide={() => setDetailedModalShow(false)}
              EnvironmentAttachment={EnvironmentAttachment}
            />
          </>
        )}
        {CountedData?.length > 0 && (
          <DropdownButton
            style={{ marginTop: 5 }}
            size='sm'
            title='Оберіть забруднення'
          >
            {CountedData.map((el, i) => {
              return (
                <Dropdown.Item
                  key={el.name + i}
                  onClick={() => {
                    setChosenData(el);
                  }}
                >
                  {el.name}
                </Dropdown.Item>
              );
            })}
          </DropdownButton>
        )}
        <div className='mt-3'>
          {user && user.id_of_expert === 3 && (
            <div>
              <Button size='sm' onClick={() => setModalShow(true)}>
                Медична статистика
              </Button>
            </div>
          )}
        </div>
        <RegionMedStatModal
          regionId={regionId}
          name={name}
          show={modalShow}
          onHide={() => setModalShow(false)}
        />
      </Popup>
    </Polygon>
  );
};

const initilDate = [
  {
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  },
];

export const Regions = ({
  regions,
  setFilteredRegions,
  ActualRegionDate,
  AdvancedEnvironments,
}) => {
  const { environmentsInfo } = useContext(EnvironmentsInfoContext);

  const idEnvironment = environmentsInfo.selected
    ? environmentsInfo.selected.id
    : null;

  const [FetchedData, setData] = useState(regions);

  const fetchRegions = () => {
    get(
      AdvancedEnvironments?.length == undefined
        ? `${REGIONS_URL}?idEnvironment=${idEnvironment}&startDate=${ActualRegionDate[0].startDate.toISOString()}&endDate=${ActualRegionDate[0].endDate.toISOString()}`
        : `${REGIONS_URL}?idEnvironment=${AdvancedEnvironments.join(
            '&idEnvironment='
          )}&startDate=${ActualRegionDate[0].startDate.toISOString()}&endDate=${ActualRegionDate[0].endDate.toISOString()}`
    )
      .then(({ data }) => {
        setData(data);
        setFilteredRegions(data);
      })
      .catch(() => {
        alert('Помилка завантаження даних,спробуйте знов');
      });
  };

  useEffect(() => {
    fetchRegions();
  }, [ActualRegionDate]);

  return (
    <>
      {FetchedData.map(
        (
          {
            regionId,
            regionPoints,
            user_name,
            name,
            lineThickness,
            AttachedEmmissions,
            emmissions,
          },
          index
        ) => {
          return (
            <Region
              key={'poligonId' + index}
              regionId={regionId}
              idEnvironment={idEnvironment}
              regionPoints={regionPoints}
              lineThickness={lineThickness}
              name={name}
              AttachedEmmissions={AttachedEmmissions}
              emissions={emmissions}
              user_name={user_name}
              EnvironmentAttachment={[]}
            />
          );
        }
      )}
    </>
  );
};
