import React, { useEffect, useState } from 'react';
import { Popup, Marker, LayersControl, LayerGroup } from 'react-leaflet';
import { divIcon } from 'leaflet/dist/leaflet-src.esm';
import { Button, Table, DropdownButton, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faBalanceScale } from '@fortawesome/free-solid-svg-icons';
import { EmissionsChartModal } from '../../charts/emissionsChartModal';

import '../popup.css';

const CheckExceptions = (Name) => {
  let Exception = 'SAVEDNIPRO_';
  if (Name.includes(Exception)) {
    return 'Пункт аналізу повітря №' + Name.slice(Exception.length);
  } else {
    return Name;
  }
};

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

const FindMaxCoif = (emmissionsStats) => {
  if (emmissionsStats == null || emmissionsStats.length < 1) {
    return null;
  }

  let coif = emmissionsStats.reduce((el, curr) =>
    el.coif > curr.coif ? el : curr
  );

  return coif;
};

const Point = ({
  id,
  coordinates,
  Name_object,
  description,
  image,
  emissions,
  owner_type,
  handleClick,
  setComaprePointId,
  isPointsNonEditable,
  EnvironmentAttachment,
  emmissionsStats,
  isAdvanced,
}) => {
  const [isComapre, setCompare] = useState(false);

  const [modalShow, setModalShow] = useState(false);

  const [chooseEmissionsLabel, setChooseEmissionsLabel] = useState('Оберіть забруднення');

  const [choosenEmissions, setChoosenEmissions] = useState(emissions);

  const [chosenemmissionsStats, setchosenemmissionsStats] = useState(
    FindMaxCoif(emmissionsStats)
  );

  const ChoosePoint = (id) => {
    setComaprePointId({ id, isComapre });
  };

  useEffect(() => {
    setchosenemmissionsStats(FindMaxCoif(emmissionsStats));
  }, [emmissionsStats]);

  return (
    <Marker
      position={coordinates}
      icon={divIcon({
        html: `
          <div class="leaflet-div-icon-wraper">
            <img class="wraper_icon" src="${image}" />
            <svg class="svg_filler" viewBox="0 0 40 55" xmlns="http://www.w3.org/2000/svg">
              <path style="fill: ${chosenemmissionsStats ? chosenemmissionsStats.color : 'grey'
          }; stroke: rgb(0, 0, 0); paint-order: stroke;" d="M 19.742 52.481 C 19.35 52.248 18.131 52.182 16.788 50.942 C 15.401 49.661 14.267 48.988 13.077 47.734 C 11.293 45.855 10.319 44.263 9.121 42.344 C 5.898 37.183 2.623 32.147 1.758 25.723 C 1.22 21.729 0.502 17.489 1.721 13.391 C 3.248 8.256 6.509 4.389 12.588 2.157 C 13.066 1.982 14.057 1.564 14.609 1.472 C 15.143 1.383 15.752 1.299 16.256 1.151 C 21.974 -0.523 27.779 0.952 34.097 6.63 C 37.688 9.857 39.355 15 39.127 20.994 C 38.933 26.087 39.102 31.087 35.405 36.007 C 37.668 32.5 25.365 54.955 19.716 52.365 C 18.622 51.863 30.639 29.002 29.861 27.599 C 29.864 27.599 30.627 26.058 31.425 23.619 C 32.146 21.415 33.086 17.55 30.789 13.627 C 29.632 11.652 27.689 9.557 25.593 8.408 C 23.982 7.525 22.01 7.32 20.447 7.505 C 18.226 7.768 16.089 8.043 14.533 8.742 C 13.397 9.252 11.812 10.129 10.421 11.136 C 9.579 11.746 9.003 13.211 8.631 14.522 C 8.32 15.616 8.256 16.698 8.122 17.938 C 7.787 21.042 8.564 24.565 10.941 27.718 C 12.408 29.664 15.125 30.955 17.804 31.57 C 21.789 32.485 25.982 31.036 29.742 27.499 C 32.037 25.34 35.748 33.857 35.748 33.857"/>
            </svg>
          </div>
          `,
      })}
    >
      <Popup
        maxWidth={window.innerWidth >= 991 ? 'auto' : window.innerWidth / 1.2}
      >
        <FontAwesomeIcon
          icon={faBalanceScale}
          onClick={() => {
            setCompare(!isComapre);
            ChoosePoint(id);
          }}
          className={
            isComapre ? 'compare-pencil-icon-active' : 'compare-pencil-icon'
          }
        />
        {sessionStorage.getItem('user') && !isPointsNonEditable && (
          <FontAwesomeIcon
            icon={faPencilAlt}
            onClick={() => handleClick(id)}
            className='edit-pencil-icon'
          />
        )}
        <div className='mt-4 mb-2'>
          {Name_object && (
            <div>
              <strong>Назва:</strong> {CheckExceptions(Name_object)}
            </div>
          )}
          {description && (
            <div>
              <strong>Опис:</strong> {description}
            </div>
          )}
          {owner_type && (
            <div>
              <strong>Форма власності:</strong> {owner_type.name}
            </div>
          )}
        </div>
        {choosenEmissions.length > 0 && (
          <>
            <div className='emissions-container'>
              <Table striped bordered size='sm' className='emissions-table'>
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
                  <ReturnLastData emissions={choosenEmissions} />
                </tbody>
              </Table>
            </div>
            <>
              <Button size='sm' onClick={() => setModalShow(true)}>
                Відобразити детальну інформацію
              </Button>
              {chosenemmissionsStats ? (
                <DropdownButton
                  style={{ marginTop: 5 }}
                  size='sm'
                  title={chooseEmissionsLabel}
                >
                  <Dropdown.Item
                    onClick={() => {
                      setchosenemmissionsStats(FindMaxCoif(emmissionsStats));
                      setChoosenEmissions(emissions);
                      setChooseEmissionsLabel('Оберіть забруднення');
                    }}
                  >
                    Усі
                  </Dropdown.Item>
                  {emmissionsStats.map((el, i) => {
                    return (
                      <Dropdown.Item
                        key={el.short_name + i}
                        onClick={() => {
                          setchosenemmissionsStats(el);
                          setChoosenEmissions(emissions.filter(x => x.short_name === el.short_name));
                          setChooseEmissionsLabel(el.short_name);
                        }}
                      >
                        {el.short_name}
                      </Dropdown.Item>
                    );
                  })}
                </DropdownButton>
              ) : (
                <></>
              )}
              <EmissionsChartModal
                id={id}
                isPoint={true}
                emissions={emissions}
                show={modalShow}
                EnvironmentAttachment={EnvironmentAttachment}
                onHide={() => setModalShow(false)}
                isAdvanced={isAdvanced}
              />
            </>
          </>
        )}
      </Popup>
    </Marker>
  );
};

export const Points = ({
  points,
  setShowPointModal,
  setPointId,
  setIsEditPointMode,
  setComaprePointId,
  isPointsNonEditable,
  uniqueObjectTypes,
  isAdvanced,
}) => {
  const handleClick = (id) => {
    setPointId(id);
    setIsEditPointMode(true);
    setShowPointModal(true);
  };

  return (
    <>
      {uniqueObjectTypes.length > 0 && (
        <LayersControl position='topleft'>
          {uniqueObjectTypes.map((el, i) => {
            return (
              <LayersControl.Overlay
                key={el.Object_Type_Id}
                checked
                name={el.Object_Type_Name}
              >
                <LayerGroup>
                  {points
                    .filter((poi) => poi.Object_Type_Id === el.Object_Type_Id)
                    .map(
                      ({
                        Id: id,
                        coordinates,
                        Name_object,
                        Description: description,
                        Image: image,
                        emissions,
                        owner_type,
                        Environments,
                        emmissionsStats,
                      }) => (
                        <Point
                          id={id}
                          key={id}
                          coordinates={coordinates}
                          Name_object={Name_object}
                          description={description}
                          image={image}
                          emissions={emissions}
                          owner_type={owner_type}
                          handleClick={handleClick}
                          setComaprePointId={setComaprePointId}
                          isPointsNonEditable={isPointsNonEditable}
                          EnvironmentAttachment={Environments}
                          emmissionsStats={emmissionsStats}
                          isAdvanced={isAdvanced}
                        />
                      )
                    )}
                </LayerGroup>
              </LayersControl.Overlay>
            );
          })}
        </LayersControl>
      )}
    </>
  );
};
