import React, { useEffect, useState, useContext } from 'react';
import { MapContainer as LeafletMap, TileLayer } from 'react-leaflet';
import { Button, Form, Spinner } from 'react-bootstrap';
import { CompareModal } from '../modals/modalCompare';

import { VerticallyCenteredModal } from '../modals/modal';
import { ActualEmmisionDate } from '../rangePicker/dateRangePicker';
import { Points } from '../mapObjects/points/points';
import { Polygons } from '../mapObjects/polygons/polygons';
import { Regions } from '../mapObjects/regions/regions';
import { EnvironmentsInfoContext } from '../context/environmentsInfoContext';

import { FooterMap } from '../map/map';

import { get } from '../../utils/httpService';
import {
  ADVANCED_POLYGONS_URL,
  MAP_CENTER_COORDS,
  OPEN_STREET_MAP_URL,
  EXPERTS_URL,
  GET_POSSIBLE_ISSUES,
  ADVANCED_POINTS_URL,
} from '../../utils/constants';
import {
  formParamsForGetCheckbox as formQuery,
  removeDuplicates,
} from '../../utils/helpers';
import './advancedmap.css';
import '../radiowidget/radiowidget.css';

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

export const AdvancedMap = ({ user }) => {
  const [SettingsShow, SetSettingsShow] = useState(true);

  const [showWarning, setShowWarning] = useState(false);

  const [LoadedPoints, setPoints] = useState([]);
  const [LoadedPolygons, setPolygons] = useState([]);

  const [isEditPointMode, setIsEditPointMode] = useState(false);
  const [pointId, setPointId] = useState(null);
  const [showPointModal, setShowPointModal] = useState(false);

  const [isEditPolygonMode, setIsEditPolygonMode] = useState(false);
  const [polygonId, setPolygonId] = useState(null);
  const [showPolygonModal, setShowPolygonModal] = useState(false);

  const [comparePointsId, setcomparePointsId] = useState([]);
  const [comaprePointId, setComaprePointId] = useState({
    id: null,
    isCompare: false,
  });
  const [comparePolygonsId, setcomparePolygonsId] = useState([]);
  const [comparePolygonId, setcomparePolygonId] = useState({
    id: null,
    isCompare: false,
  });

  const [chosenEnvironments, setEnvironments] = useState([]);
  const [chosenObjects, setChosenObjects] = useState(null);

  const [uniqueObjectTypes, setuniqueObjectTypes] = useState([]);

  const [filteredRegions, setFilteredRegions] = useState([]);

  const [ActualRegionDate, SetActualRegionDate] = useState(initilDate);

  const submitForm = () => {
    let form = document.forms.advancedForm;
    let chosenEnvironment = Array.from(
      form.elements.environmentCheckbox
    ).filter(({ checked }) => checked);
    return (
      chosenEnvironment.length != 0 ||
      form.elements[`environmentAllCheckbox`].checked
    );
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (submitForm()) {
      let form = document.forms.advancedForm;
      let chosenEnvironment = Array.from(
        form.elements.environmentCheckbox
      ).filter(({ checked }) => checked);
      let chosenExperts = Array.from(form.elements.expertCheckbox).filter(
        ({ checked }) => checked
      );
      let chosenObjects = Array.from(form.elements.objectCheckbox)
        .filter(({ checked }) => checked)
        ?.map((el) => el.value);
      let choshenIssue = form.elements.issueCheckbox
        ? Array.from(
            form.elements.issueCheckbox.length > 0
              ? form.elements.issueCheckbox
              : [form.elements.issueCheckbox]
          ).filter(({ checked }) => checked)
        : [];
      let query =
        chosenEnvironment.length === 0 &&
        chosenExperts.length === 0 &&
        choshenIssue.length === 0
          ? ''
          : '?';

      if (query.length > 0) {
        let expQuer = formQuery(chosenExperts, 'experts');
        let envQuer = formQuery(chosenEnvironment, 'env');
        let issueQuer = formQuery(choshenIssue, 'issue');
        query += expQuer;
        query += expQuer && envQuer ? '&' + envQuer : envQuer;
        query +=
          (expQuer || envQuer) && issueQuer ? '&' + issueQuer : issueQuer;
      }

      let PromiseArr = [];

      if (
        chosenObjects.find((el) => el == 'points') ||
        chosenObjects?.length == 0
      ) {
        PromiseArr.push(get(ADVANCED_POINTS_URL + query));
      } else {
        PromiseArr.push(
          new Promise((resolve, rejcet) => {
            resolve();
          })
        );
      }

      if (
        chosenObjects.find((el) => el == 'polygon') ||
        chosenObjects?.length == 0
      ) {
        PromiseArr.push(get(ADVANCED_POLYGONS_URL + query));
      } else {
        PromiseArr.push(
          new Promise((resolve, rejcet) => {
            resolve();
          })
        );
      }

      Promise.all([...[...PromiseArr]]).then((res) => {
        if (res[0]?.data) {
          //[0] points
          setPoints(res[0].data);
          setuniqueObjectTypes(
            removeDuplicates(
              res[0].data.map((el) => {
                return {
                  Object_Type_Id: el.Object_Type_Id,
                  Object_Type_Name: el.Object_Type_Name,
                };
              })
            )
          );
        } else {
          setPoints([]);
          setuniqueObjectTypes([]);
        }
        if (res[1]?.data) {
          setPolygons(res[1].data); //[1] polygons
        } else {
          setPolygons([]);
        }
        SetSettingsShow(false);
      });
      setEnvironments(
        chosenEnvironment.map((el) => {
          return el.value;
        })
      );
      setChosenObjects(chosenObjects);
    } else {
      setShowWarning(true);
    }
  };

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
      >
        {LoadedPoints.length === 0 && Polygons.length === 0 && (
          <div className='BlackMapWarning'>
            <Button
              onClick={() => {
                SetSettingsShow(true);
              }}
            >
              Будь ласка оберіть параметри фільтрації в меню вище{' '}
            </Button>
          </div>
        )}
        <TileLayer url={OPEN_STREET_MAP_URL} />

        {(chosenObjects?.find((el) => el == 'points') ||
          chosenObjects?.length == 0) && (
          <Points
            points={LoadedPoints}
            setPointId={setPointId}
            setIsEditPointMode={setIsEditPointMode}
            setShowPointModal={setShowPointModal}
            setComaprePointId={setComaprePointId}
            uniqueObjectTypes={uniqueObjectTypes}
            isPointsNonEditable={true}
            isAdvanced={true}
          />
        )}

        {(chosenObjects?.find((el) => el == 'polygon') ||
          chosenObjects?.length == 0) && (
          <Polygons
            polygons={LoadedPolygons}
            setPolygonId={setPolygonId}
            setIsEditPolygonMode={setIsEditPolygonMode}
            setShowPolygonModal={setShowPolygonModal}
            setcomparePolygonId={setcomparePolygonId}
            isPolyggonsNonEditable={true}
            isSpecial={true}
          />
        )}

        {(chosenObjects?.find((el) => el == 'region') ||
          chosenObjects?.length == 0) && (
          <Regions
            regions={filteredRegions}
            setFilteredRegions={setFilteredRegions}
            ActualRegionDate={ActualRegionDate}
          />
        )}

        <UpButton show={SetSettingsShow} />
      </LeafletMap>

      <FooterMap>
        <FooterComponents
          comparePointsId={comparePointsId}
          comparePolygonsId={comparePolygonsId}
          chosenEnvironments={chosenEnvironments}
        />
      </FooterMap>

      <AdvancedFilter
        show={SettingsShow}
        ActualRegionDate={ActualRegionDate}
        SetActualRegionDate={SetActualRegionDate}
        onHide={() => {
          SetSettingsShow(false);
        }}
        submitForm={submitHandler}
      />

      <WarningAlert
        label={'Оберіть будь ласка хоч одне середовище'}
        show={showWarning}
        hide={() => {
          setShowWarning(false);
        }}
      />
    </>
  );
};

const AdvancedFilter = ({
  show,
  onHide,
  submitForm,
  ActualRegionDate,
  SetActualRegionDate,
}) => {
  const { environmentsInfo, setEnvironmentsInfo } = useContext(
    EnvironmentsInfoContext
  );

  const [showWarning, setShowWarning] = useState(false);

  const [existingExperts, setExistingExperts] = useState([]);

  const [existingObjects, setExistingObjects] = useState([
    {
      type: 'points', //points
      label: 'Точки',
      checked: false,
    },
    {
      type: 'polygon', //polygon
      label: 'Полігони',
      checked: false,
    },
    {
      type: 'region', //region
      label: 'Області',
      checked: false,
    },
  ]);

  const [possibleIssues, setPossibleIssues] = useState([]);
  const [isLoading, setisLoading] = useState(false);

  useEffect(() => {
    if (existingExperts.length === 0) {
      get(EXPERTS_URL).then(({ data }) => {
        setExistingExperts(data);
      });
    }
  }, []);

  const fetchpossibleIssues = () => {
    let form = document.forms.advancedForm;
    let chosenEnvironment = Array.from(
      form.elements.environmentCheckbox
    ).filter(({ checked }) => checked);
    let chosenExperts = Array.from(form.elements.expertCheckbox).filter(
      ({ checked }) => checked
    );
    let query =
      chosenEnvironment.length === 0 && chosenExperts.length === 0 ? '' : '?';
    if (query.length > 0) {
      query += formQuery(chosenExperts, 'experts');
      query +=
        chosenExperts.length === 0
          ? formQuery(chosenEnvironment, 'env')
          : '&' + formQuery(chosenEnvironment, 'env');
    }
    setisLoading(true);
    get(GET_POSSIBLE_ISSUES + `${query}`).then(({ data }) => {
      setPossibleIssues(data);
      setisLoading(false);
    });
  };

  const CheckAllCheckBoxes = (objName, secondary) => {
    let form = document.forms.advancedForm;
    let mainCheckBox = form.elements[`${objName}`];
    let secondaryCheckBoxes = Array.from(form.elements[`${secondary}`]);
    if (
      mainCheckBox.checked &&
      secondaryCheckBoxes.filter(({ checked }) => checked).length > 0
    ) {
      secondaryCheckBoxes.forEach((el) => {
        el.checked = false;
      });
      setShowWarning(true);
    }
    if (
      !mainCheckBox.checked &&
      secondaryCheckBoxes.filter(({ checked }) => checked).length === 0
    ) {
      return false;
    } else {
      return true;
    }
  };

  return (
    <>
      <VerticallyCenteredModal
        size='xl'
        show={show}
        onHide={onHide}
        header='Оберіть експерта, середовище та задачу'
      >
        {existingExperts.length === 0 ? (
          <Spinner
            className='loading-spiner'
            animation='border'
            variant='primary'
          />
        ) : (
          <Form
            className='advancedForm'
            name='advancedForm'
            onSubmit={submitForm}
          >
            <h5>Оберіть середовище:</h5>
            <div className='checkbox-list'>
              <div className='checkWrap'>
                <Form.Check
                  onChange={() => {
                    if (
                      CheckAllCheckBoxes(
                        'environmentAllCheckbox',
                        'environmentCheckbox'
                      )
                    ) {
                      fetchpossibleIssues();
                    }
                  }}
                  value={-1}
                  className='checkField'
                  name='environmentAllCheckbox'
                  type='checkbox'
                  label={'Усі середовища'}
                />
              </div>
              {environmentsInfo.environments.map((el) => {
                return (
                  <div key={el.id} className='checkWrap'>
                    <Form.Check
                      onChange={() => {
                        if (
                          CheckAllCheckBoxes(
                            'environmentAllCheckbox',
                            'environmentCheckbox'
                          )
                        ) {
                          fetchpossibleIssues();
                        }
                      }}
                      value={el.id}
                      className='checkField'
                      name='environmentCheckbox'
                      type='checkbox'
                      label={el.name}
                    />
                  </div>
                );
              })}
            </div>

            <hr style={{ width: '100%' }} />
            <h5>Оберіть типи об'єктів:</h5>
            <div className='checkbox-list'>
              <div className='checkWrap'>
                <Form.Check
                  onChange={() => {
                    CheckAllCheckBoxes('objectAllCheckbox', 'objectCheckbox');
                  }}
                  value={-1}
                  className='checkField'
                  name='objectAllCheckbox'
                  type='checkbox'
                  label={"Усі об'єкти"}
                />
              </div>
              {existingObjects.map((el) => {
                return (
                  <div key={el.type} className='checkWrap'>
                    <Form.Check
                      onChange={() => {
                        CheckAllCheckBoxes(
                          'objectAllCheckbox',
                          'objectCheckbox'
                        );
                      }}
                      value={el.type}
                      className='checkField'
                      name='objectCheckbox'
                      type='checkbox'
                      label={el.label}
                    />
                  </div>
                );
              })}
            </div>

            <hr style={{ width: '100%' }} />
            <h5>Оберіть експерта:</h5>
            <div className='checkbox-list'>
              <div className='checkWrap'>
                <Form.Check
                  onChange={() => {
                    if (
                      CheckAllCheckBoxes('expertAllCheckbox', 'expertCheckbox')
                    ) {
                      fetchpossibleIssues();
                    }
                  }}
                  value={-1}
                  className='checkField'
                  name='expertAllCheckbox'
                  type='checkbox'
                  label={'Усі експерти'}
                />
              </div>
              {existingExperts.map((el) => {
                return (
                  <div key={el.id_of_expert} className='checkWrap'>
                    <Form.Check
                      onChange={() => {
                        if (
                          CheckAllCheckBoxes(
                            'expertAllCheckbox',
                            'expertCheckbox'
                          )
                        ) {
                          fetchpossibleIssues();
                        }
                      }}
                      value={el.id_of_expert}
                      className='checkField'
                      name='expertCheckbox'
                      type='checkbox'
                      label={el.expert_name}
                    />
                  </div>
                );
              })}
            </div>
            <hr style={{ width: '100%' }} />
            {isLoading ? (
              <div className='SpinerWraper'>
                <Spinner animation='grow' variant='primary' />
              </div>
            ) : (
              possibleIssues.length > 0 && (
                <>
                  <h5>Оберіть задачу:</h5>
                  <div className='checkbox-list'>
                    <div className='checkWrap'>
                      <Form.Check
                        onChange={() => {
                          CheckAllCheckBoxes(
                            'issueAllCheckbox',
                            'issueCheckbox'
                          );
                        }}
                        value={-1}
                        className='checkField'
                        name='issueAllCheckbox'
                        type='checkbox'
                        label={'Усі здачі'}
                      />
                    </div>
                    {possibleIssues.map((el) => {
                      return (
                        <div key={el.issue_id} className='checkWrap'>
                          <Form.Check
                            onChange={() => {
                              CheckAllCheckBoxes(
                                'issueAllCheckbox',
                                'issueCheckbox'
                              );
                            }}
                            value={el.issue_id}
                            className='checkField'
                            name='issueCheckbox'
                            type='checkbox'
                            label={el.name}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <hr style={{ width: '100%' }} />
                </>
              )
            )}
            <h5>Оберіть проміжок актуальності даних для областей:</h5>
            <ActualEmmisionDate
              dateState={ActualRegionDate}
              SetDateState={SetActualRegionDate}
              initilDate={initilDate}
              enabled={true}
            />
            <Button type='submit'> Відобразити точки </Button>
          </Form>
        )}
      </VerticallyCenteredModal>
      <WarningAlert
        label={'Пункт "Усі" може використовуватись лише окремо '}
        show={showWarning}
        hide={() => {
          setShowWarning(false);
        }}
      />
    </>
  );
};

const FooterComponents = ({
  comparePointsId,
  comparePolygonsId,
  chosenEnvironments,
}) => {
  const isAdaptive = () => {
    return window.innerWidth <= 991;
  };

  const [compareModalForm, setcompareModalForm] = useState(false);

  return (
    <>
      {/*  Compare some  */}
      <Button
        className='ms-3'
        size='sm'
        variant={'outline-primary'}
        style={{
          width: isAdaptive() ? '70%' : '',
          marginBottom: '2px',
          marginTop: '2px',
          cursor: 'pointer',
          pointerEvents: 'all',
        }}
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
        chosenEnvironments={chosenEnvironments}
        show={compareModalForm}
        onHide={() => setcompareModalForm(false)}
      />
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

const WarningAlert = ({ label, show, hide }) => {
  const [isNotShowing, setIsNotShowing] = useState(true);

  useEffect(() => {
    if (show && isNotShowing) {
      setIsNotShowing(false);
      setTimeout(() => {
        hide();
        setIsNotShowing(true);
      }, 2000);
    }
  }, [show]);

  return (
    <div className={`WarningAlert ${show ? 'showWarning' : ''}`}>
      <b>{label}</b>
    </div>
  );
};
