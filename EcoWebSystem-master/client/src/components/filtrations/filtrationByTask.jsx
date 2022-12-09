import React, { useState, useEffect } from 'react';
import { DropdownButton, Dropdown } from 'react-bootstrap';
import { get } from '../../utils/httpService.js';
import { TASK_URL } from '../../utils/constants.js';

import './filtrationByTask.css';

/*
  initTasks = [
    {
      name:"",
      object_arr:[],
    }
  ];
*/

const initTitle = 'Список задач';

export const FiltarionByTasks = ({
  filteredPoints,
  setFilteredPoints,
  setFilteredItems,
}) => {
  const [Title, setTitle] = useState(initTitle);

  const [Chosen, setChosen] = useState(null);

  const [Tasks, setAllTasks] = useState([]);

  const setTasks = () => {
    get(TASK_URL).then(({ data }) => {
      let tempTasks = [];
      data.forEach((el) => {
        if (!tempTasks.some((elem) => elem.name === el.name)) {
          tempTasks.push({
            name: el.name,
            object_arr: [],
          });
        }
      });
      data.forEach((el) => {
        let obj = tempTasks.find((elem) => elem.name === el.name);
        if (obj) {
          obj.object_arr.push(el.id_of_object);
        }
      });
      setAllTasks(tempTasks);
    });
  };

  const [shouldUpdate, setUpdate] = useState(false);

  useEffect(() => {
    if (Tasks.length === 0) {
      setTasks();
    }
  }, []);

  const DropHandlerClick = (element) => {
    let tempPoints = filteredPoints.filter((el) => {
      if (element.object_arr.some((id) => id === el.Id)) {
        return el;
      }
    });
    if (tempPoints.length > 0) {
      setFilteredPoints(tempPoints);
      setChosen(element.name);
      setTitle(
        element.name.length > 12
          ? element.name.substring(0, 10) + '...'
          : element.name
      );
      setUpdate(!shouldUpdate);
    } else {
      alert('По даній задачі нема маркерів');
    }
  };

  const ClearChosenList = () => {
    setFilteredItems({
      isMyObjectsSelectionChecked: false,
      items: [],
    });
    setTitle(initTitle);
    setChosen(null);
    setUpdate(!shouldUpdate);
  };

  return (
    <div>
      <hr />
      <b>Оберіть задачу</b>
      <DropdownButton
        onClick={() => {
          setTasks();
          setUpdate(!shouldUpdate);
        }}
        className='drop-tasks'
        title={Title}
      >
        {Tasks.length > 0 && filteredPoints.length > 0 && (
          <>
            {Chosen && (
              <Dropdown.Item
                onClick={() => {
                  ClearChosenList();
                }}
              >
                Відміна
              </Dropdown.Item>
            )}

            {Tasks.map((el, index) => {
              if (!Chosen) {
                return (
                  <Dropdown.Item
                    key={index}
                    active={el.chosen}
                    onClick={() => {
                      DropHandlerClick(el);
                    }}
                  >
                    {el.name}
                  </Dropdown.Item>
                );
              } else {
                return <></>;
              }
            })}
          </>
        )}
        {Tasks.length === 0 || filteredPoints.length === 0 ? (
          <Dropdown.Item>Немає задач</Dropdown.Item>
        ) : (
          ''
        )}
      </DropdownButton>
    </div>
  );
};
