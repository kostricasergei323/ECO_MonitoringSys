import React, { useEffect, useState } from 'react';
import { Popup, Polygon, Marker, Tooltip } from 'react-leaflet';
import { Button, Table, DropdownButton, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faBalanceScale } from '@fortawesome/free-solid-svg-icons';

import { EmissionsChartModal } from '../../charts/emissionsChartModal';

import { EnvironmentsInfoContext } from '../../context/environmentsInfoContext';

import '../popup.css';

const initialState = {
  showEmissionsChartModal: false,
  emissionCalculations: [],
  CorArr: [],
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

const Polygonobj = ({
  poligonId,
  polygonPoints,
  lineThickness,
  brushColorR,
  brushColorG,
  brushColorB,
  emissions,
  name,
  PointsInfo,
  mapMode,
  user_name,
  handleClick,
  setcomparePolygonId,
  isPolyggonsNonEditable,
  EnvironmentAttachment,
}) => {
  const [isComapre, setCompare] = React.useState(false);

  const [modalShow, setModalShow] = React.useState(false);

  const [emmissionsStats, setemmissionsStats] = useState([]);

  const [chosenemmissionsStats, setchosenemmissionsStats] = useState(null);

  // useEffect(()=>{
  //   if(PointsInfo && PointsInfo.length>0 && emmissionsStats.length <5){
  //     setemmissionsStats(CheckPointsPolygon(PointsInfo,polygonPoints.slice()));
  //   }
  // },[PointsInfo])

  // useEffect(()=>{
  //   if(!chosenemmissionsStats && emmissionsStats.length>0){
  //     setchosenemmissionsStats(FindMaxCoif(emmissionsStats));
  //   }
  // },[emmissionsStats])

  useEffect(() => {
    if (mapMode != 'region') {
      setemmissionsStats([]);
      setchosenemmissionsStats(null);
    }
  }, [mapMode]);

  const ChoosePolygon = (id) => {
    setcomparePolygonId({ id, isComapre });
  };

  // const CheckColor = ()=>{

  //   if(chosenemmissionsStats && chosenemmissionsStats.color && mapMode=='region' ){
  //     return chosenemmissionsStats.color;
  //   }else if(
  //     !chosenemmissionsStats &&
  //     emmissionsStats &&
  //     emmissionsStats.length===0 &&
  //     mapMode=='region'
  //   ){
  //     return 'grey';
  //   }
  //   else{
  //     return `rgba(${brushColorR}, ${brushColorG}, ${brushColorB}, 1)`
  //   }
  // }

  if (polygonPoints && polygonPoints.length > 0) {
    return (
      <Polygon
        positions={polygonPoints}
        weight={lineThickness}
        color={
          `rgba(${brushColorR}, ${brushColorG}, ${brushColorB}, 1)` /*"grey"CheckColor()*/
        }
      >
        <Popup
          maxWidth={window.innerWidth >= 991 ? 'auto' : window.innerWidth / 1.2}
        >
          <FontAwesomeIcon
            icon={faBalanceScale}
            onClick={() => {
              setCompare(!isComapre);
              ChoosePolygon(poligonId);
            }}
            className={
              isComapre ? 'compare-pencil-icon-active' : 'compare-pencil-icon'
            }
          />
          {sessionStorage.getItem('user') && !isPolyggonsNonEditable && (
            <FontAwesomeIcon
              icon={faPencilAlt}
              onClick={() => handleClick(poligonId)}
              className='edit-pencil-icon'
            />
          )}
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
              <Button size='sm' onClick={() => setModalShow(true)}>
                Відобразити графіки викидів
              </Button>
              <EmissionsChartModal
                id={poligonId}
                emissions={emissions}
                show={modalShow}
                onHide={() => setModalShow(false)}
                EnvironmentAttachment={EnvironmentAttachment}
              />
            </>
          )}
          {chosenemmissionsStats ? (
            <DropdownButton
              style={{ marginTop: 5 }}
              size='sm'
              title='Оберіть забруднення'
            >
              {emmissionsStats.map((el, i) => {
                return (
                  <Dropdown.Item
                    key={el.short_name + i}
                    onClick={() => {
                      setchosenemmissionsStats(el);
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
        </Popup>
      </Polygon>
    );
  } else {
    return <></>;
  }
};

const DragPoint = ({
  position,
  DeleteMarker,
  index,
  newPolygonCoordinates,
  setNewPolygonCoordinates,
}) => {
  const markerRef = React.useRef(null);

  const DragHandler = () => {
    initialState.CorArr = [...newPolygonCoordinates];
    initialState.CorArr[index] = markerRef.current.leafletElement._latlng;
    setNewPolygonCoordinates(initialState.CorArr);
  };

  return (
    <Marker
      ondrag={DragHandler}
      key={'AddingN' + index}
      draggable={true}
      position={position}
      ref={markerRef}
    >
      <Popup>
        <div>
          <Button
            size='sm'
            onClick={() => {
              DeleteMarker(index);
            }}
          >
            Видалити точку
          </Button>
        </div>
      </Popup>
      <Tooltip> {index + 1} </Tooltip>
    </Marker>
  );
};

export const AddingPolygon = ({
  newPolygonCoordinates,
  setNewPolygonCoordinates,
}) => {
  const DeleteMarker = (index) => {
    initialState.CorArr = [...newPolygonCoordinates];

    initialState.CorArr.splice(
      initialState.CorArr.findIndex((el, i) => i == index),
      1
    );
    setNewPolygonCoordinates(initialState.CorArr);
  };

  return (
    <Polygon positions={newPolygonCoordinates}>
      {newPolygonCoordinates.map((el, i) => {
        return (
          <DragPoint
            key={i}
            position={el}
            DeleteMarker={DeleteMarker}
            index={i}
            newPolygonCoordinates={newPolygonCoordinates}
            setNewPolygonCoordinates={setNewPolygonCoordinates}
          />
        );
      })}
    </Polygon>
  );
};

export const Polygons = ({
  polygons,
  setPolygonId,
  setIsEditPolygonMode,
  setShowPolygonModal,
  PointsInfo,
  mapMode,
  setcomparePolygonId,
  isPolyggonsNonEditable,
}) => {
  const handleClick = (polygonId) => {
    setPolygonId(polygonId);
    setIsEditPolygonMode(true);
    setShowPolygonModal(true);
  };

  const { environmentsInfo, setEnvironmentsInfo } = React.useContext(
    EnvironmentsInfoContext
  );

  return (
    <>
      {polygons.map(
        (
          {
            poligonId,
            polygonPoints,
            brushColorR,
            brushColorG,
            brushColorB,
            user_name,
            name,
            emissions,
            lineThickness,
            idEnvironment,
            type,
            Environments,
          },
          index
        ) => {
          if (
            idEnvironment ===
              (environmentsInfo.selected ? environmentsInfo.selected.id : -1) ||
            type == 'region' ||
            Environments
          ) {
            return (
              <Polygonobj
                key={'poligonId' + index}
                poligonId={poligonId}
                polygonPoints={polygonPoints}
                lineThickness={lineThickness}
                brushColorR={brushColorR}
                brushColorG={brushColorG}
                brushColorB={brushColorB}
                emissions={emissions}
                name={name}
                PointsInfo={PointsInfo}
                user_name={user_name}
                handleClick={handleClick}
                mapMode={mapMode}
                setcomparePolygonId={setcomparePolygonId}
                isPolyggonsNonEditable={isPolyggonsNonEditable}
                EnvironmentAttachment={Environments}
              />
            );
          }
        }
      )}
    </>
  );
};
