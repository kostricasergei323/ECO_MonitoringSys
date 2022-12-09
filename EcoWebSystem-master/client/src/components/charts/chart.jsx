import React from 'react';
import { PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#A8E4A0',
  '#30D5C8',
  '#3E5F8A',
  '#00BFFF',
  '#BDDA57',
];

const valuePrecision = 4;

export const Chart = ({ title, data }) => {
  const dataForView = data.map((item) => ({
    ...item,
    value: +item.value.toFixed(valuePrecision),
  }));

  return (
    <div style={{ padding: '2px' }}>
      <h5 className='text-center'>{title}</h5>
      <PieChart width={350} height={350}>
        <Pie
          data={dataForView}
          cx={'50%'}
          cy={200}
          label
          labelLine={false}
          outerRadius={80}
          fill='#8884d8'
          dataKey='value'
          isAnimationActive={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend
          verticalAlign='top'
          height={20}
          iconType={'circle'}
          margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </PieChart>
    </div>
  );
};
