import React, { createRef, useEffect, useState } from 'react';
import { Button, Navbar } from 'react-bootstrap';
import { MapContainer as LeafletMap, TileLayer } from 'react-leaflet';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAlignJustify,
  faAngleDoubleDown,
} from '@fortawesome/free-solid-svg-icons';

import {
  getDataForLegendRegion,
  getDataForLegendPoint,
  RADIATION_POINTS_URL,
} from '../../utils/constants';

import { get } from '../../utils/httpService';
import {
  POLYGONS_URL,
  POINTS_URL,
  MAP_CENTER_COORDS,
  OPEN_STREET_MAP_URL,
  RECOUNT_POINTS_COIF_URL,
  getLegendDescription,
} from '../../utils/constants';
import { removeObjectDuplicates, removeDuplicates } from '../../utils/helpers';

import { Polygons, AddingPolygon } from '../mapObjects/polygons/polygons';
import { Regions } from '../mapObjects/regions/regions';
import { Points } from '../mapObjects/points/points';
import { AddPointModal } from '../addComponents/addPointModal';
import { AddPolygonModal } from '../addComponents/addPolygonModal';
import { AddRadiationPointModal } from '../addComponents/addRadiationPointModal';
import { AddTubeModal } from '../addComponents/addTubeModal';
import { Filtration } from '../filtrations/filtration';
import { CompareModal } from '../modals/modalCompare';
import { FinderOnMap } from '../onMapFinder/onMapFinder';
import { Tubes, AddingTube } from '../mapObjects/tubes/tubes';
import { VerticallyCenteredModal } from '../modals/modal';
import { ActualEmmisionDate } from '../rangePicker/dateRangePicker';
import { RadiationPoints } from '../mapObjects/radiationPoints/radiationPoints';

import { Legend } from '../helperComponents/mapLegend/mapLegend';

import './map.css';
import { EnvironmentsInfoContext } from '../context/environmentsInfoContext';
import { useContext } from 'react';
import { useRef } from 'react';

const RADIATION_ENV_ID = 7;

const initilDate = [
  {
    startDate: new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate()
    ),
    endDate: new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate()
    ),
    key: 'selection',
  },
];

const initialState = {
  points: [],
  radiationPoints: [],
  polygons: [
    {
      name: '',
      expertName: '',
      polygonPoints: [],
    },
  ],
  regionPolygons: [
    {
      name: '',
      expertName: '',
      polygonPoints: [],
    },
  ],
  tubes: [
    {
      name: '',
      expertName: '',
      tubePoints: [],
    },
  ],
  filteredPolygons: [],
  filteredRegions: [],
  filteredItems: {
    isMyObjectsSelectionChecked: false,
    items: [],
  },
  uniqueObjectTypes: [],
  filteredPoints: [],
  isAddPointModeEnabled: false,
  isAddPolygonModeEnabled: false,
  isAddRadiationPointModeEnabled: false,
  isAddTubeMode: false,
  showPointModal: false,
  showRadiationPointModal: false,
  showPolygonModal: false,
  showTubeModal: false,
  newPointCoordinates: [],
  newPolygonCoordinates: [],
  newTubeCordinates: [],
  shouldFetchData: true,
  isEditPointMode: false,
  pointId: null,
  isEditPolygonMode: false,
  isEditTubeMode: false,
  polygonId: null,
  tubeId: null,
  mapMode: null,
  compareMode: false,
  comparePointsId: [],
  comparePolygonsId: [],
  comaprePointId: {
    id: null,
    isCompare: false,
  },
  comparePolygonId: {
    id: null,
    isCompare: false,
  },
  compareModalForm: false,
  sideLeftFilterOpened: false,
  sideRightFilterOpened: false,
};

const buttonText = (geographicalObj, isModeEnabled) =>
  isModeEnabled
    ? `Виключити режим додавання`
    : `Додати ${geographicalObj} на карту`;

const comparebuttonText = (geographicalObj, isModeEnabled) =>
  isModeEnabled ? `Виключити обрання маркерів` : `Обрати ${geographicalObj} `;

export const MapView = ({ user }) => {
  const [SettingsShow, SetSettingsShow] = useState(false);

  const [filteredItems, setFilteredItems] = useState(
    initialState.filteredItems
  );
  const [shouldFetchData, setShouldFetchData] = useState(
    initialState.shouldFetchData
  );

  // points
  const [filteredPoints, setFilteredPoints] = useState(
    initialState.filteredPoints
  );

  const [isAddPointModeEnabled, setAddPointMode] = useState(
    initialState.isAddPointModeEnabled
  );
  const [showPointModal, setShowPointModal] = useState(
    initialState.showPointModal
  );

  // radiation points
  const [radiationPoints, setRadiationPoints] = useState(
    initialState.radiationPoints
  );

  const [showRadiationPointModal, setShowRadiationPointModal] = useState(
    initialState.showRadiationPointModal
  );
  const [newPointCoordinates, setNewPointCoordinates] = useState(
    initialState.newPointCoordinates
  );
  const [comparePointsId, setcomparePointsId] = useState(
    initialState.comparePointsId
  );

  const [comaprePointId, setComaprePointId] = useState(
    initialState.comaprePointId
  );

  const [ActualPointsDate, SetActualPointsDate] = useState(initilDate);

  const [LastDateMode, setLastDateMode] = useState(false);

  // polygons
  const [filteredPolygons, setFilteredPolygons] = useState(
    initialState.filteredPolygons
  );
  const [isAddPolygonModeEnabled, setAddPolygonMode] = useState(
    initialState.isAddPolygonModeEnabled
  );

  const [isAddRadiationPointModeEnabled, setAddRadiationPointMode] = useState(
    initialState.isAddRadiationPointModeEnabled
  );

  const [showPolygonModal, setShowPolygonModal] = useState(
    initialState.showPolygonModal
  );
  const [newPolygonCoordinates, setNewPolygonCoordinates] = useState(
    initialState.newPolygonCoordinates
  );
  const [comparePolygonsId, setcomparePolygonsId] = useState(
    initialState.comparePolygonsId
  );
  const [comparePolygonId, setcomparePolygonId] = useState(
    initialState.comparePolygonId
  );
  const [filteredRegions, setFilteredRegions] = useState(
    initialState.filteredRegions
  );
  const [ActualRegionDate, SetActualRegionDate] = useState(initilDate);

  const [mapMode, setmapMode] = useState(initialState.mapMode);

  // tubes

  const [filteredTubes, setFilteredTubes] = useState(initialState.tubes);

  const [isAddTubeMode, setisAddTubeMode] = useState(
    initialState.isAddTubeMode
  );

  const [newTubeCordinates, setnewTubeCordinates] = useState([]);

  const [showTubeModal, setshowTubeModal] = useState(
    initialState.showTubeModal
  );

  // type of ownership

  const [uniqueObjectTypes, setuniqueObjectTypes] = useState(
    initialState.uniqueObjectTypes
  );

  // edit point
  const [isEditPointMode, setIsEditPointMode] = useState(
    initialState.isEditPointMode
  );
  const [pointId, setPointId] = useState(initialState.pointId);

  //edit polygon
  const [isEditPolygonMode, setIsEditPolygonMode] = useState(
    initialState.isEditPolygonMode
  );
  const [polygonId, setPolygonId] = useState(initialState.polygonId);

  //edit tube
  const [isEditTubeMode, setisEditTubeMode] = useState(
    initialState.isEditTubeMode
  );
  const [tubeId, settubeId] = useState(initialState.tubeId);

  //environmentsInfo
  const { environmentsInfo, setEnvironmentsInfo } = useContext(
    EnvironmentsInfoContext
  );

  //side filtrations

  const [sideLeftFilterOpened, setLeftFilterOpened] = useState(
    initialState.sideLeftFilterOpened
  );

  const [sideRightFilterOpened, setRightFilterOpened] = useState(
    initialState.sideLeftFilterOpened
  );

  const fetchPoints = () => {
    get(`${POINTS_URL}?idEnvironment=${environmentsInfo.selected.id}`).then(
      ({ data }) => {
        setFilteredPoints(data);
        setuniqueObjectTypes([]);
        setuniqueObjectTypes(
          removeDuplicates(
            data.map((el) => {
              return {
                Object_Type_Id: el.Object_Type_Id,
                Object_Type_Name: el.Object_Type_Name,
              };
            })
          )
        );
        initialState.points = data;
      }
    );
  };

  const fetchRadiationPoints = () => {
    get(`${RADIATION_POINTS_URL}`).then(({ data }) => {
      setRadiationPoints(data);
    });
  };

  const fetchPolygons = () => {
    const idEnvironment = environmentsInfo.selected.id;

    get(`${POLYGONS_URL}?idEnvironment=${idEnvironment}`).then(({ data }) => {
      let polygons = [],
        tubes = [];
      data.forEach((el, index) => {
        if (el.type === 'tube') {
          tubes.push(el);
        }
      });

      polygons = data.filter(
        (el) => el.type !== 'region' && el.type !== 'tube'
      );
      setFilteredPolygons(polygons);
      setFilteredTubes(tubes);
    });
  };

  const fetchData = () => {
    fetchPolygons();
    fetchPoints();
    fetchRadiationPoints();
  };

  const filterByExpert = ({ id_of_expert: idOfExpert }) =>
    filteredItems.items.some(({ id_of_expert }) => idOfExpert === id_of_expert);

  const filterByUser = ({ id_of_user: idOfUser }) =>
    filteredItems.items.some(({ id_of_user }) => idOfUser === id_of_user);

  //environmnt changes effect
  useEffect(() => {
    if (environmentsInfo.environments.length && !environmentsInfo.selected) {
      setEnvironmentsInfo({
        selected: environmentsInfo.environments[0],
        environments: environmentsInfo.environments,
      });
    }
  }, [environmentsInfo.environments]);

  //data fatch effect
  useEffect(() => {
    if (
      shouldFetchData &&
      environmentsInfo.selected &&
      environmentsInfo.selected.id === RADIATION_ENV_ID
    ) {
      fetchRadiationPoints();
      setShouldFetchData(false);
    } else if (shouldFetchData && environmentsInfo.selected && LastDateMode) {
      fetchData();
      setShouldFetchData(false);
    } else if (shouldFetchData && environmentsInfo.selected && !LastDateMode) {
      fetchPolygons();
      setShouldFetchData(false);
    }
  }, [shouldFetchData, environmentsInfo.selected]);

  useEffect(() => {
    if (
      !LastDateMode &&
      environmentsInfo.selected &&
      environmentsInfo.selected.id !== RADIATION_ENV_ID
    ) {
      get(
        `${POINTS_URL}?idEnvironment=${
          environmentsInfo.selected.id
        }&startDate=${ActualPointsDate[0].startDate.toISOString()}&endDate=${ActualPointsDate[0].endDate.toISOString()}`
      ).then(({ data }) => {
        setFilteredPoints(data);
        setuniqueObjectTypes([]);
        setuniqueObjectTypes(
          removeDuplicates(
            data.map((el) => {
              return {
                Object_Type_Id: el.Object_Type_Id,
                Object_Type_Name: el.Object_Type_Name,
              };
            })
          )
        );
        initialState.points = data;
      });
    } else if (LastDateMode && environmentsInfo.selected) {
      fetchPoints();
    } else if (
      environmentsInfo.selected &&
      environmentsInfo.selected.id === RADIATION_ENV_ID
    ) {
      fetchRadiationPoints();
    }
  }, [ActualPointsDate, LastDateMode, environmentsInfo.selected]);

  //filter effect
  useEffect(() => {
    if (filteredItems.items.length) {
      let filteredPolygons = [];
      let filteredPoints = [];

      filteredPolygons = initialState.polygons.filter(filterByExpert);
      filteredPoints = initialState.points.filter(filterByExpert);

      if (filteredItems.isMyObjectsSelectionChecked) {
        const myPolygons = initialState.polygons.filter(filterByUser);
        const myPoints = initialState.points.filter(filterByUser);

        filteredPolygons = [...filteredPolygons, ...myPolygons];
        filteredPoints = [...filteredPoints, ...myPoints];
      }

      filteredPoints = removeObjectDuplicates(filteredPoints, 'Id');
      filteredPolygons = removeObjectDuplicates(filteredPolygons, 'polygonId');

      setFilteredPoints(filteredPoints);
      setFilteredPolygons(filteredPolygons);
    } else {
      setFilteredPoints(initialState.points);
      setFilteredPolygons(initialState.polygons);
    }
  }, [filteredItems]);

  //side bars effect
  useEffect(() => {
    if (sideLeftFilterOpened) {
      setRightFilterOpened(false);
    }
  }, [sideLeftFilterOpened]);

  useEffect(() => {
    if (sideRightFilterOpened) {
      setLeftFilterOpened(false);
    }
  }, [sideRightFilterOpened]);

  //compare points
  useEffect(() => {
    if (comaprePointId.id) {
      let points = ([] = [...comparePointsId]);
      if (
        !comparePointsId.find((id) => id == comaprePointId.id) &&
        !comaprePointId.isCompare
      ) {
        points.push(comaprePointId.id);
      } else {
        points.splice(points.indexOf(comaprePointId.id), 1);
      }
      setcomparePointsId(points);
    }
  }, [comaprePointId]);

  //compare polygons
  useEffect(() => {
    if (comparePolygonId.id) {
      let polygons = ([] = [...comparePolygonsId]);
      if (
        !comparePolygonsId.find((id) => id == comparePolygonId.id) &&
        !comparePolygonId.isCompare
      ) {
        polygons.push(comparePolygonId.id);
      } else {
        polygons.splice(polygons.indexOf(comparePolygonId.id), 1);
      }
      setcomparePolygonsId(polygons);
    }
  }, [comparePolygonId]);

  const addGeographicalObjectToMap = ({ latlng: { lat, lng } }) => {
    if (isAddPointModeEnabled) {
      setNewPointCoordinates([lat, lng]);
      setShowPointModal(true);
      return;
    }

    if (isAddPolygonModeEnabled) {
      setNewPolygonCoordinates([...newPolygonCoordinates, { lat, lng }]);
    }

    if (isAddTubeMode) {
      setnewTubeCordinates([...newTubeCordinates, { lat, lng }]);
    }

    if (isAddRadiationPointModeEnabled) {
      setNewPointCoordinates([lat, lng]);
      setShowRadiationPointModal(true);
      return;
    }
  };

  //object creation effects
  useEffect(() => {
    if (!showPolygonModal) {
      setNewPolygonCoordinates([]);
    }
  }, [isAddPolygonModeEnabled, showPolygonModal]);

  useEffect(() => {
    if (!showTubeModal) {
      setnewTubeCordinates([]);
    }
  }, [isAddTubeMode, showTubeModal]);

  const MapRef = useRef(null);

  const ViewReposition = (lat, lon, scale = 11) => {
    MapRef.current.leafletElement.setView({ lat, lon }, scale);
  };

  return (
    <>
      <LeafletMap
        center={MAP_CENTER_COORDS}
        zoom={6}
        maxZoom={15}
        attributionControl={true}
        zoomControl={true}
        doubleClickZoom={true}
        scrollWheelZoom={true}
        dragging={true}
        animate={true}
        easeLinearity={0.35}
        ref={MapRef}
        preferCanvas={true}
        onClick={addGeographicalObjectToMap}
      >
        <TileLayer url={OPEN_STREET_MAP_URL} />

        <UpButton show={SetSettingsShow} />
        <VerticallyCenteredModal
          size='xl'
          show={SettingsShow}
          onHide={() => {
            SetSettingsShow(false);
          }}
          header='Оберіть проміжок актуальності даних для полігонів'
        >
          <ActualEmmisionDate
            dateState={ActualRegionDate}
            SetDateState={SetActualRegionDate}
            initilDate={initilDate}
            enabled={true}
          />

          <hr></hr>
          <h4>Оберіть проміжок актуальності даних для точок</h4>
          <hr></hr>
          <div style={{ display: 'flex' }}>
            <Button
              style={{
                marginLeft: 'auto',
                marginRight: 'auto',
                marginBottom: 5,
              }}
              onClick={() => {
                setLastDateMode(!LastDateMode);
              }}
            >
              {LastDateMode
                ? 'Режим останніх даних'
                : 'Режим для обрання періоду забрудення'}
            </Button>
          </div>
          {!LastDateMode && (
            <ActualEmmisionDate
              enabled={!LastDateMode}
              dateState={ActualPointsDate}
              SetDateState={SetActualPointsDate}
              initilDate={initilDate}
            />
          )}
        </VerticallyCenteredModal>

        {mapMode == null && (
          <Polygons
            polygons={filteredPolygons}
            mapMode={mapMode}
            setPolygonId={setPolygonId}
            setIsEditPolygonMode={setIsEditPolygonMode}
            setShowPolygonModal={setShowPolygonModal}
            setcomparePolygonId={setcomparePolygonId}
          />
        )}

        {mapMode === 'region' && (
          <Regions
            regions={filteredRegions}
            setFilteredRegions={setFilteredRegions}
            ActualRegionDate={ActualRegionDate}
            SetActualRegionDate={SetActualRegionDate}
          />
        )}

        {mapMode === 'tubes' && (
          <Tubes
            tubeArr={filteredTubes}
            settubeId={settubeId}
            setisEditTubeMode={setisEditTubeMode}
            setshowTubeModal={setshowTubeModal}
          />
        )}

        <Points
          points={filteredPoints}
          setPointId={setPointId}
          setIsEditPointMode={setIsEditPointMode}
          setShowPointModal={setShowPointModal}
          setComaprePointId={setComaprePointId}
          uniqueObjectTypes={uniqueObjectTypes}
        />

        <RadiationPoints radiationPoints={radiationPoints} />

        {getDataForLegendPoint(
          environmentsInfo.selected ? environmentsInfo.selected.id : null
        ) && (
          <Legend
            regionData={getDataForLegendRegion(
              environmentsInfo.selected ? environmentsInfo.selected.id : null
            )}
            regionDesc={getLegendDescription(
              'region',
              environmentsInfo.selected ? environmentsInfo.selected.id : null
            )}
            pointData={getDataForLegendPoint(
              environmentsInfo.selected ? environmentsInfo.selected.id : null
            )}
            pointDesc={getLegendDescription(
              'points',
              environmentsInfo.selected ? environmentsInfo.selected.id : null
            )}
          />
        )}

        {newPolygonCoordinates.length > 0 && (
          <AddingPolygon
            newPolygonCoordinates={newPolygonCoordinates}
            setNewPolygonCoordinates={setNewPolygonCoordinates}
          />
        )}

        {newTubeCordinates.length > 0 && (
          <AddingTube
            newTubeCordinates={newTubeCordinates}
            setnewTubeCordinates={setnewTubeCordinates}
          />
        )}
      </LeafletMap>

      <FooterMap>
        <FooterComponents
          user={user}
          setShowPolygonModal={setShowPolygonModal}
          setAddPointMode={setAddPointMode}
          setNewPolygonCoordinates={setNewPolygonCoordinates}
          setAddPolygonMode={setAddPolygonMode}
          setisAddTubeMode={setisAddTubeMode}
          setAddRadiationPointMode={setAddRadiationPointMode}
          setshowTubeModal={setshowTubeModal}
          setnewTubeCordinates={setnewTubeCordinates}
          newPolygonCoordinates={newPolygonCoordinates}
          newTubeCordinates={newTubeCordinates}
          isAddPointModeEnabled={isAddPointModeEnabled}
          isAddTubeMode={isAddTubeMode}
          isAddPolygonModeEnabled={isAddPolygonModeEnabled}
          isAddRadiationPointModeEnabled={isAddRadiationPointModeEnabled}
          comparePointsId={comparePointsId}
          comparePolygonsId={comparePolygonsId}
        />
      </FooterMap>

      <Filtration
        user={user}
        setFilteredItems={setFilteredItems}
        filteredPoints={filteredPoints}
        setFilteredPoints={setFilteredPoints}
        environmentsInfo={environmentsInfo}
        sideLeftFilterOpened={sideLeftFilterOpened}
        setLeftFilterOpened={setLeftFilterOpened}
      />

      <FinderOnMap
        ViewReposition={ViewReposition}
        setmapMode={setmapMode}
        sideRightFilterOpened={sideRightFilterOpened}
        setRightFilterOpened={setRightFilterOpened}
      />

      <AddPointModal
        show={showPointModal}
        onHide={() => setShowPointModal(false)}
        setShouldFetchData={setShouldFetchData}
        coordinates={newPointCoordinates}
        isEditPointMode={isEditPointMode}
        setIsEditPointMode={setIsEditPointMode}
        pointId={pointId}
        setPointId={setPointId}
        user={user}
      />
      <AddPolygonModal
        show={showPolygonModal}
        onHide={() => setShowPolygonModal(false)}
        setShouldFetchData={setShouldFetchData}
        setNewPolygonCoordinates={setNewPolygonCoordinates}
        coordinates={newPolygonCoordinates}
        user={user}
        isEditPolygonMode={isEditPolygonMode}
        setIsEditPolygonMode={setIsEditPolygonMode}
        polygonId={polygonId}
        setPolygonId={setPolygonId}
      />
      <AddTubeModal
        show={showTubeModal}
        onHide={setshowTubeModal}
        coordinates={newTubeCordinates}
        setnewTubeCordinates={setnewTubeCordinates}
        user={user}
        tubeId={tubeId}
        isEditTubeMode={isEditTubeMode}
        setisEditTubeMode={setisEditTubeMode}
        settubeId={settubeId}
        setShouldFetchData={setShouldFetchData}
      />
      <AddRadiationPointModal
        show={showRadiationPointModal}
        onHide={() => setShowRadiationPointModal(false)}
        setShouldFetchData={setShouldFetchData}
        coordinates={newPointCoordinates}
        pointId={pointId}
        setPointId={setPointId}
        user={user}
      />
    </>
  );
};

const AdpFooterRef = createRef();

const AdaptiveFooterComponents = ({ children, elmargin, show, setShow }) => {
  return (
    <div
      ref={AdpFooterRef}
      style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1002,
        left: 0,
        width: '100%',
        bottom: elmargin.height,
        backgroundColor: '#b0e8ef',
        visibility: show ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>
  );
};

const myRef = createRef();

export const FooterMap = (props) => {
  //footer Adap
  const [changeFooter, setChangeFooter] = useState(window.innerWidth <= 991);

  window.addEventListener('resize', () => {
    setChangeFooter(window.innerWidth <= 991);
  });

  const [height, setHeight] = useState(
    myRef.current ? myRef.current.getBoundingClientRect() : 0
  );

  const [showFooterMenu, setFooterMenu] = useState(false);

  const handlerFooter = () => {
    setHeight(myRef.current ? myRef.current.getBoundingClientRect() : 0);
    setFooterMenu((prev) => !prev);
  };

  return (
    <div ref={myRef}>
      {!changeFooter && (
        <Navbar expand='lg' className='map-options d-flex'>
          {props.children}
        </Navbar>
      )}
      {changeFooter && (
        <Navbar
          expand='lg'
          className='map-options d-flex justify-content-center'
        >
          <FontAwesomeIcon
            icon={showFooterMenu ? faAngleDoubleDown : faAlignJustify}
            style={{ width: 40, height: 30, color: 'grey' }}
            onClick={() => {
              handlerFooter();
            }}
          />
          <AdaptiveFooterComponents
            elmargin={height}
            show={showFooterMenu}
            setShow={setFooterMenu}
          >
            {props.children}
          </AdaptiveFooterComponents>
        </Navbar>
      )}
    </div>
  );
};

const FooterComponents = ({
  user,
  comparePolygonsId,
  comparePointsId,
  isAddPointModeEnabled,
  isAddPolygonModeEnabled,
  isAddRadiationPointModeEnabled,
  isAddTubeMode,
  setShowPolygonModal,
  setAddPointMode,
  setAddRadiationPointMode,
  setNewPolygonCoordinates,
  setAddPolygonMode,
  setisAddTubeMode,
  setshowTubeModal,
  setnewTubeCordinates,
  newTubeCordinates,
  newPolygonCoordinates,
}) => {
  const isAdaptive = () => {
    return window.innerWidth <= 991;
  };

  const { environmentsInfo, setEnvironmentsInfo } = useContext(
    EnvironmentsInfoContext
  );

  //compare
  const [isCompareMode, setCompareMode] = useState(initialState.compareMode);

  const [compareModalForm, setcompareModalForm] = useState(
    initialState.compareModalForm
  );

  const finishCompare = () => {
    setCompareMode(false);
  };

  const finishPolygon = () => {
    setAddPolygonMode(false);

    if (newPolygonCoordinates.length >= 3) {
      setShowPolygonModal(true);
    } else {
      setNewPolygonCoordinates([]);
    }
  };

  const finishTube = () => {
    setisAddTubeMode(false);

    if (newTubeCordinates.length >= 2) {
      setshowTubeModal(true);
    } else {
      setnewTubeCordinates([]);
    }
  };

  return (
    <>
      {/*  Add point button  */}
      {user && (
        <Button
          size='sm'
          variant={isAddPointModeEnabled ? 'outline-danger' : 'outline-primary'}
          style={{
            marginBottom: '2px',
            marginTop: '2px',
            width: isAdaptive() ? '70%' : '',
            cursor:
              isAddPolygonModeEnabled || isCompareMode || isAddTubeMode
                ? 'not-allowed'
                : 'pointer',
            pointerEvents:
              isAddPolygonModeEnabled || isCompareMode || isAddTubeMode
                ? 'all'
                : 'auto',
          }}
          disabled={isAddPolygonModeEnabled || isCompareMode || isAddTubeMode}
          onClick={() => setAddPointMode(!isAddPointModeEnabled)}
          className='ml-3'
        >
          {buttonText('маркер', isAddPointModeEnabled)}
        </Button>
      )}

      {/* Add plygon button  */}
      {user && (
        <Button
          className='ml-3'
          size='sm'
          variant={
            isAddPolygonModeEnabled ? 'outline-danger' : 'outline-primary'
          }
          style={{
            width: isAdaptive() ? '70%' : '',
            marginBottom: '2px',
            marginTop: '2px',
            cursor:
              isAddPointModeEnabled || isCompareMode || isAddTubeMode
                ? 'not-allowed'
                : 'pointer',
            pointerEvents:
              isAddPointModeEnabled || isCompareMode || isAddTubeMode
                ? 'all'
                : 'auto',
          }}
          disabled={isAddPointModeEnabled || isCompareMode || isAddTubeMode}
          onClick={() => setAddPolygonMode(!isAddPolygonModeEnabled)}
        >
          {buttonText('полігон', isAddPolygonModeEnabled)}
        </Button>
      )}

      {isAddPolygonModeEnabled && (
        <Button
          style={{
            width: isAdaptive() ? '70%' : '',
            marginBottom: '2px',
            marginTop: '2px',
          }}
          className='ml-3'
          size='sm'
          variant='outline-success'
          onClick={finishPolygon}
        >
          Закінчити полігон
        </Button>
      )}

      {/* Add tube button  */}
      {user && (
        <Button
          className='ml-3'
          size='sm'
          variant={isAddTubeMode ? 'outline-danger' : 'outline-primary'}
          style={{
            width: isAdaptive() ? '70%' : '',
            marginBottom: '2px',
            marginTop: '2px',
            cursor:
              isAddPointModeEnabled || isCompareMode || isAddPolygonModeEnabled
                ? 'not-allowed'
                : 'pointer',
            pointerEvents:
              isAddPointModeEnabled || isCompareMode || isAddPolygonModeEnabled
                ? 'all'
                : 'auto',
          }}
          disabled={
            isAddPointModeEnabled || isCompareMode || isAddPolygonModeEnabled
          }
          onClick={() => setisAddTubeMode(!isAddTubeMode)}
        >
          {buttonText('трубу', isAddTubeMode)}
        </Button>
      )}

      {isAddTubeMode && (
        <Button
          style={{
            width: isAdaptive() ? '70%' : '',
            marginBottom: '2px',
            marginTop: '2px',
          }}
          className='ml-3'
          size='sm'
          variant='outline-success'
          onClick={finishTube}
        >
          Закінчити трубу
        </Button>
      )}

      {isCompareMode && (
        <Button
          style={{
            width: isAdaptive() ? '70%' : '',
            marginBottom: '2px',
            marginTop: '2px',
          }}
          className='ml-3'
          size='sm'
          variant='outline-success'
          onClick={finishCompare}
        >
          Порівняти точки
        </Button>
      )}

      {/*  Compare some  */}
      <Button
        className='ml-3'
        size='sm'
        variant={'outline-primary'}
        style={{
          width: isAdaptive() ? '70%' : '',
          marginBottom: '2px',
          marginTop: '2px',
          cursor:
            isAddPolygonModeEnabled ||
            isAddPointModeEnabled ||
            isCompareMode ||
            isAddTubeMode
              ? 'not-allowed'
              : 'pointer',
          pointerEvents:
            isAddPolygonModeEnabled ||
            isAddPointModeEnabled ||
            isCompareMode ||
            isAddTubeMode
              ? 'all'
              : 'auto',
        }}
        disabled={
          isAddPolygonModeEnabled ||
          isAddPointModeEnabled ||
          isCompareMode ||
          isAddTubeMode
        }
        onClick={() => setcompareModalForm(true)}
      >
        Результати порівняння
      </Button>

      <CompareModal
        style={{
          width: isAdaptive() ? '70%' : '',
          marginBottom: '2px',
          marginTop: '2px',
        }}
        points={comparePointsId}
        polygons={comparePolygonsId}
        show={compareModalForm}
        onHide={() => setcompareModalForm(false)}
      />

      {/*  Add radiation point button  */}
      {user &&
        user.id_of_expert === 2 &&
        environmentsInfo.selected &&
        environmentsInfo.selected.id === RADIATION_ENV_ID && (
          <Button
            size='sm'
            variant={
              isAddRadiationPointModeEnabled
                ? 'outline-danger'
                : 'outline-primary'
            }
            style={{
              marginBottom: '2px',
              marginTop: '2px',
              width: isAdaptive() ? '70%' : '',
              cursor:
                isAddPolygonModeEnabled ||
                isCompareMode ||
                isAddTubeMode ||
                isAddPointModeEnabled
                  ? 'not-allowed'
                  : 'pointer',
              pointerEvents:
                isAddPolygonModeEnabled ||
                isCompareMode ||
                isAddTubeMode ||
                isAddPointModeEnabled
                  ? 'all'
                  : 'auto',
            }}
            disabled={
              isAddPolygonModeEnabled ||
              isCompareMode ||
              isAddTubeMode ||
              isAddPointModeEnabled
            }
            onClick={() =>
              setAddRadiationPointMode(!isAddRadiationPointModeEnabled)
            }
            className='ml-3'
          >
            {buttonText('радіаційний об`єкт', isAddRadiationPointModeEnabled)}
          </Button>
        )}
    </>
  );
};

const UpButton = ({ show }) => {
  return (
    <div
      className='upsideButton'
      onClick={() => {
        show(true);
      }}
    />
  );
};
