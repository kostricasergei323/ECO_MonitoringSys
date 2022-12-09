import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  //Legend,
  ResponsiveContainer,
} from 'recharts';
import './compareChart.css';

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

export const CompareChart = ({ title, data }) => {
  let datesForView = [];
  for (const itr of [
    ...new Set(
      data.map((el) => {
        return el.DateEm;
      })
    ),
  ]) {
    datesForView.push({
      name: itr,
    });
  }

  for (const itr of datesForView) {
    for (const item of data.filter((el) => el.DateEm == itr.name)) {
      itr[item.Name_Object] = item.ValueAvg;
    }
  }

  return (
    <div className='compare-chart'>
      <h3>{title}</h3>
      <ResponsiveContainer width='100%' height={250}>
        <LineChart
          width={500}
          height={250}
          data={datesForView}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='name' />
          <YAxis />
          <Tooltip />
          {[
            ...new Set(
              data.map((el) => {
                return el.Name_Object;
              })
            ),
          ].map((el, index) => {
            return (
              <Line
                key={el}
                type='monotone'
                dataKey={el}
                stroke={COLORS[index % COLORS.length]}
              />
            );
          })}
          {/* <Legend
            align='left'
            verticalAlign='bottom'
            width={750}
            wrapperStyle={{}}
            margin={{ top: 0, left: 0, right: 0, bottom: -5 }}
          /> */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
