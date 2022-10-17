import React from 'react';

import './mapLegend.css';
import { Button } from 'react-bootstrap';

export const Legend = ({ pointData, regionData, pointDesc, regionDesc }) => {
  const [legendTypes, setLegendTypes] = React.useState([
    {
      text: 'Точки',
      grades: pointData,
      Description: pointDesc,
    },
    {
      text: 'Області',
      grades: regionData,
      Description: regionDesc,
    },
  ]);

  const [chosenType, setChosen] = React.useState(0);

  return (
    <div className='info legend'>
      <Button
        style={{ marginBottom: 4 }}
        onClick={() => {
          setChosen(chosenType === 0 ? 1 : 0);
        }}
      >
        {legendTypes[chosenType].text}
      </Button>
      {legendTypes[chosenType]?.Description && (
        <div className='borderedDescription'>
          {legendTypes[chosenType].Description}
        </div>
      )}
      <div>
        <i style={{ background: 'grey' }} /> Дані відсутні
      </div>

      {legendTypes[chosenType].grades.map((el, i) => {
        return (
          <div key={i}>
            <i style={{ background: `${el.color}` }} />
            <span>
              {(el.min === -Infinity ? '0' : el.min) +
                (el.max === Infinity ? '+' : '-' + el.max)}
            </span>
          </div>
        );
      })}
    </div>
  );
};
