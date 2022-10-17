import React from 'react';
import { Dropdown } from 'react-bootstrap';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const EmissionLineChart = ({ emissions }) => {
  const [elementName, setElementName] = React.useState('');

  if (!emissions) {
    return null;
  }

  return (
    <div>
      {Object.keys(emissions).length > 0 && (
        <Dropdown className='me-2 mb-2'>
          <Dropdown.Toggle size='md'>
            {elementName || 'Оберіть елемент'}
          </Dropdown.Toggle>

          <Dropdown.Menu>
            {emissions &&
              Object.keys(emissions).map((emissionName) => (
                <Dropdown.Item
                  key={emissionName}
                  active={emissionName === elementName}
                  onClick={() => {
                    setElementName(emissionName);
                  }}
                >
                  {emissionName}
                </Dropdown.Item>
              ))}
          </Dropdown.Menu>
        </Dropdown>
      )}
      {Object.keys(emissions).length > 0 && elementName && (
        <ResponsiveContainer width='100%' height={200}>
          <LineChart
            width={400}
            height={200}
            data={emissions[elementName]}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='name' />
            <YAxis />
            <Tooltip />
            <Line
              connectNulls
              type='monotone'
              dataKey='Середнє значення'
              stroke='#8884d8'
            />
            <Line
              connectNulls
              type='monotone'
              dataKey='Максимальне значення'
              stroke='#82ca9d'
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
