import React, { useEffect } from 'react';
import { Table, DropdownButton, Dropdown } from 'react-bootstrap';

import { CompareChart } from '../charts/compareChart.jsx';

import { DateRangePicker, DateRange } from 'react-date-range';
import { addDays } from 'date-fns';
import { uk } from 'date-fns/locale';

import { get } from '../../utils/httpService';
import { COMPARE_EMISSIONS } from '../../utils/constants';
import { useState } from 'react';
import { useContext } from 'react';
import { EnvironmentsInfoContext } from '../context/environmentsInfoContext';
import { removeObjectDuplicates } from '../../utils/helpers';
import { VerticallyCenteredModal } from '../modals/modal';

import { formParamsForGetArr } from '../../utils/helpers';
import './modalCompare.css';

export const CompareModal = ({
  points,
  polygons,
  chosenEnvironments,
  ...props
}) => {
  const { environmentsInfo } = useContext(EnvironmentsInfoContext);

  const [Compares, setCompares] = useState([]);

  const [dateWidth, setDateWidth] = React.useState(window.innerWidth);

  const handleWidth = () => {
    setDateWidth(window.innerWidth);
  };

  if (window.onresize === 'function') {
    window.removeEventListener(handleWidth);
  } else {
    window.addEventListener('resize', handleWidth);
  }

  const [EmissionModes, setEmissionModes] = useState([
    {
      name: null,
      measure: null,
    },
  ]);

  const [ChosenEmissionMode, setChosenEmissionMode] = useState({
    base: true,
    set: '',
    measue: null,
  });

  const [TableWillUpdate, setTableWillUpdate] = useState(false);

  const [state, setState] = React.useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      key: 'selection',
    },
  ]);

  const handleHideClick = () => {
    props.onHide();
    setChosenEmissionMode({ base: true, set: '', measue: null });
  };

  useEffect(() => {
    if (props.show) {
      const [date] = state;
      let IdArr = '';

      const idEnvironment = environmentsInfo.selected
        ? environmentsInfo.selected.id
        : null;
      const chosenEnv = chosenEnvironments
        ? formParamsForGetArr(chosenEnvironments, 'idEnvironment')
        : null;

      for (const itr of points) {
        IdArr += `&PointsId[]=${itr}`;
      }
      for (const itr of polygons) {
        IdArr += `&PolygonsId[]=${itr}`;
      }

      get(
        `${COMPARE_EMISSIONS}?${chosenEnv ? chosenEnv : `idEnvironment=${idEnvironment}`
        }${IdArr}&startDate=${date.startDate.toISOString()}&endDate=${date.endDate.toISOString()}`
      ).then(({ data }) => {
        setCompares(data);
        setEmissionModes(
          removeObjectDuplicates(
            data.map((el) => {
              return {
                name: el.ElementName,
                measure: el.Measure,
              };
            }),
            'name'
          )
        );
      });
    } else {
      setCompares([]);
    }
  }, [props.show, state]);

  useEffect(() => {
    if (ChosenEmissionMode.base) {
      Compares.forEach((el) => (el.visible = true));
    } else {
      Compares.forEach((el) => {
        if (el.ElementName == ChosenEmissionMode.set) {
          el.visible = true;
        } else {
          el.visible = false;
        }
      });
    }

    setTableWillUpdate(true);
  }, [ChosenEmissionMode]);

  useEffect(() => {
    setTableWillUpdate(false);
  }, [TableWillUpdate]);

  const TableData = ({ TableWillUpdate }) => {
    return (
      <Table className='CompareTable' responsive size='lg' style={{ display: "block", maxHeight: "250px" }}>
        <thead style={{ position: "sticky" }}>
          <tr>
            <th title='Обʼєкт'>Обʼєкт</th>
            <th title='Максимальне значення'>Максимальне значення</th>
            <th title='Середнє значення'>Середнє значення</th>
            <th title='Дата додавання'>Дата додавання</th>
            <th title='Одиниця виміру'>Одиниця виміру</th>
            <th title='Назва елементу'>Назва елементу</th>
          </tr>
        </thead>
        <tbody>
          {Compares.filter(d => d.visible).map((d, i) => {
            return (
              <tr key={'thNameObj=' + i} title={d.Name_Object}>
                <td>{d.Name_Object}</td>
                <td>{d.ValueMax}</td>
                <td>{d.ValueAvg}</td>
                <td>{d.DateEm}</td>
                <td>{d.Measure}</td>
                <td>{d.ElementName}</td>
              </tr>
            );
          })}
          {/* <tr>
            <th title='Максимальне значення'>Максимальне значення</th>
            {Compares.map((d, i) => {
              if (d.visible) {
                return (
                  <td key={'thValueMax=' + i} title={d.ValueMax}>
                    {d.ValueMax}
                  </td>
                );
              }
            })}
          </tr>
          <tr>
            <th title='Середенє значення'>Середенє значення</th>
            {Compares.map((d, i) => {
              if (d.visible) {
                return (
                  <td key={'thValueAvg=' + i} title={d.ValueAvg}>
                    {d.ValueAvg}
                  </td>
                );
              }
            })}
          </tr>
          <tr>
            <th title='Дата додавання'>Дата додавання</th>
            {Compares.map((d, i) => {
              if (d.visible) {
                return (
                  <td key={'thDate=' + i} title={d.DateEm}>
                    {d.DateEm}
                  </td>
                );
              }
            })}
          </tr>
          <tr>
            <th title='Одиниця виміру'>Одиниця виміру</th>
            {Compares.map((d, i) => {
              if (d.visible) {
                return (
                  <td key={'thMeasue=' + i} title={d.Measure}>
                    {d.Measure}
                  </td>
                );
              }
            })}
          </tr>
          <tr>
            <th title='Назва елементу'>Назва елементу</th>
            {Compares.map((d, i) => {
              if (d.visible) {
                return (
                  <td key={'thElementName=' + i} title={d.ElementName}>
                    {d.ElementName}
                  </td>
                );
              }
            })}
          </tr> */}
        </tbody>
      </Table>
    );
  };

  return (
    <VerticallyCenteredModal
      size='xl'
      show={props.show}
      onHide={handleHideClick}
      header="Порівняння обраних об'єктів."
    >
      <h4>Оберіть дати для відображення викидів за певний період</h4>
      {dateWidth > 1200 ? (
        <DateRangePicker
          locale={uk}
          onChange={(item) => setState([item.selection])}
          showSelectionPreview={true}
          moveRangeOnFirstSelection={false}
          months={2}
          ranges={state}
          direction='horizontal'
        />
      ) : (
        <div style={{ display: 'flex' }}>
          <DateRange
            locale={uk}
            editableDateInputs={true}
            onChange={(item) => setState([item.selection])}
            showSelectionPreview={true}
            moveRangeOnFirstSelection={false}
            ranges={state}
            className='adaptiveDateRange'
          />
        </div>
      )}

      {Compares.length > 0 && (
        <>
          <DropdownButton
            className='DropDownElementButton'
            title={
              ChosenEmissionMode.set == ''
                ? 'Елемент забруднення'
                : ChosenEmissionMode.set
            }
            id='bg-vertical-dropdown-1'
          >
            <Dropdown.Item
              onClick={() =>
                setChosenEmissionMode({
                  base: true,
                  set: 'Усі можливі',
                  measue: null,
                })
              }
            >
              {' '}
              Усі можливі{' '}
            </Dropdown.Item>
            {EmissionModes.map((el) => {
              return (
                <Dropdown.Item
                  key={el.name + el.measure}
                  onClick={() =>
                    setChosenEmissionMode({
                      base: false,
                      set: el.name,
                      measue: el.measure,
                    })
                  }
                >
                  {' '}
                  {el.name}{' '}
                </Dropdown.Item>
              );
            })}
          </DropdownButton>
          {ChosenEmissionMode.measue && (
            <h4>Одиниця виміру: {ChosenEmissionMode.measue}</h4>
          )}
          <TableData TableWillUpdate={TableWillUpdate} />
          {!ChosenEmissionMode.base && (
            <CompareChart
              title={'Графік викидів'}
              data={Compares.filter((el) => el.visible == true)}
            />
          )}
        </>
      )}
    </VerticallyCenteredModal>
    // <Modal
    //   {...props}
    //   size='lg'
    //   aria-labelledby='contained-modal-title-vcenter'
    //   centered
    // >
    //   <Modal.Header closeButton>
    //     <Modal.Title id='contained-modal-title-vcenter'>
    //       Порівняння обраних об'єктів.
    //     </Modal.Title>
    //   </Modal.Header>
    //   <Modal.Body>
    //     <h4>Оберіть дати для відображення викидів за певний період</h4>
    //     <DateRangePicker
    //       locale={uk}
    //       onChange={(item) => setState([item.selection])}
    //       showSelectionPreview={true}
    //       moveRangeOnFirstSelection={false}
    //       months={2}
    //       ranges={state}
    //       direction='horizontal'
    //     />
    //     {Compares.length > 0 && (
    //       <>
    //         <DropdownButton
    //           className='DropDownElementButton'
    //           title={
    //             ChosenEmissionMode.set == ''
    //               ? 'Елемент забруднення'
    //               : ChosenEmissionMode.set
    //           }
    //           id='bg-vertical-dropdown-1'
    //         >
    //           <Dropdown.Item
    //             onClick={() =>
    //               setChosenEmissionMode({
    //                 base: true,
    //                 set: 'Усі можливі',
    //                 measue: null,
    //               })
    //             }
    //           >
    //             {' '}
    //             Усі можливі{' '}
    //           </Dropdown.Item>
    //           {EmissionModes.map((el) => {
    //             return (
    //               <Dropdown.Item
    //                 onClick={() =>
    //                   setChosenEmissionMode({
    //                     base: false,
    //                     set: el.name,
    //                     measue: el.measure,
    //                   })
    //                 }
    //               >
    //                 {' '}
    //                 {el.name}{' '}
    //               </Dropdown.Item>
    //             );
    //           })}
    //         </DropdownButton>
    //         {ChosenEmissionMode.measue && (
    //           <h4>Одиниця виміру: {ChosenEmissionMode.measue}</h4>
    //         )}
    //         <TableData TableWillUpdate={TableWillUpdate} />
    //         {!ChosenEmissionMode.base && (
    //           <CompareChart
    //             title={'Графік викидів'}
    //             data={Compares.filter((el) => el.visible == true)}
    //           />
    //         )}
    //       </>
    //     )}
    //   </Modal.Body>
    //   <Modal.Footer>
    //     <Button onClick={handleHideClick}>Закрити</Button>
    //   </Modal.Footer>
    // </Modal>
  );
};
