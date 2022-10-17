import React from 'react';
import { DateRangePicker, DateRange } from 'react-date-range';
import { addDays } from 'date-fns';
import { uk } from 'date-fns/locale';

import { EMISSIONS_CALCULATIONS_URL } from '../../utils/constants';
import { get } from '../../utils/httpService';
import { useContext } from 'react';
import { EnvironmentsInfoContext } from '../context/environmentsInfoContext';

import { formParamsForGetArr } from '../../utils/helpers';

import './dateRangePicker.css';

export const DateRangePickerView = ({
  id,
  param,
  setEmissionCalculations,
  EnvironmentAttachment,
}) => {
  const { environmentsInfo } = useContext(EnvironmentsInfoContext);

  const [dateWidth, setDateWidth] = React.useState(window.innerWidth);

  const handleWidth = () => {
    setDateWidth(window.innerWidth);
  };

  if (window.onresize === 'function') {
    window.removeEventListener(handleWidth);
  } else {
    window.addEventListener('resize', handleWidth);
  }

  const [state, setState] = React.useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      key: 'selection',
    },
  ]);

  React.useEffect(() => {
    const [date] = state;

    const idEnvironment = environmentsInfo.selected
      ? environmentsInfo.selected.id
      : null;
    const envParam = formParamsForGetArr(EnvironmentAttachment, 'envAttach');

    get(
      `${EMISSIONS_CALCULATIONS_URL}?idEnvironment=${idEnvironment}&${param}=${id}&startDate=${date.startDate.toISOString()}&endDate=${date.endDate.toISOString()}${
        EnvironmentAttachment && EnvironmentAttachment.length > 0
          ? '&' + envParam
          : ''
      }`
    ).then(({ data }) => {
      setEmissionCalculations(data);
    });
  }, [id, state]);

  return (
    <>
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
            moveRangeOnFirstSelection={false}
            ranges={state}
            className='adaptiveDateRange'
          />
        </div>
      )}
    </>
  );
};

export const ActualEmmisionDate = ({
  dateState,
  SetDateState,
  initilDate,
  enabled,
}) => {
  React.useEffect(() => {
    if (enabled) {
      if (
        dateState[0].endDate > new Date() &&
        dateState[0].startDate > new Date()
      ) {
        SetDateState(initilDate);
      } else if (dateState[0].endDate > new Date()) {
        dateState[0].endDate = new Date();
        SetDateState(dateState);
      }
    }
  }, [dateState]);

  return (
    <div style={{ display: 'flex' }}>
      <DateRange
        locale={uk}
        editableDateInputs={true}
        onChange={(item) => SetDateState([item.selection])}
        moveRangeOnFirstSelection={false}
        ranges={dateState}
        className='adaptiveDateRange'
      />
    </div>
  );
};
