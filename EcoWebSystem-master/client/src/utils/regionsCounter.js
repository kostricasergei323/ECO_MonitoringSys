import {
  DENGEROUS_LVL_ATMOSPHERE,
  DENGEROUS_LVL_WATER,
  DENGEROUS_LVL_DEFAULT,
} from './constants';

const DangerClassAtmosphere = {
  1: 1.6,
  2: 1.3,
  3: 1.0,
  4: 0.85,
};

const DefualtResult = {
  lvl: 0,
  min: null,
  max: null,
  color: 'grey',
};

const getResultLvl = (value, list) => {
  let obj = list.find((el) => value >= el.min && value <= el.max);
  if (obj === undefined) {
    return [];
  }

  return obj;
};

const countAtmosphere = (arr) => {
  let resValue = 0,
    avg,
    grouped;

  grouped = arr.reduce((acc, elem) => {
    if (!acc[elem.name]) {
      acc[elem.name] = [];
    }

    acc[elem.name].push(elem);
    return acc;
  }, {});

  for (const name in grouped) {
    avg = 0;
    grouped[name].forEach((el) => {
      avg += el.ValueAvg;
    });
    grouped[name] = {
      res: getResultLvl(
        Math.pow(
          avg / grouped[name].length / grouped[name][0].mpc_avrg_d,
          DangerClassAtmosphere[grouped[name][0].danger_class]
        ),
        DENGEROUS_LVL_ATMOSPHERE
      ),
    };
  }

  let resArr = [];

  for (const key in grouped) {
    let obj = resArr.find((el) => el.name == key);
    if (!obj) {
      resArr.push({
        name: key,
        res: grouped[key],
      });
    }
  }

  return resArr;
};

const countWater = (arr) => {
  let resValue = 0,
    tmp,
    grouped;

  grouped = arr.reduce((acc, elem) => {
    if (!acc[elem.name]) {
      acc[elem.name] = [];
    }

    acc[elem.name].push(elem);
    return acc;
  }, {});

  for (const key in grouped) {
    tmp = 0;
    resValue = 0;
    grouped[key].forEach((el) => {
      tmp += el.ValueAvg / el.mpc_avrg_d;
      if (!isNaN(tmp) && tmp !== Infinity) {
        resValue += tmp;
      }
    });
    grouped[key] = {
      res: getResultLvl(resValue / grouped[key].length, DENGEROUS_LVL_WATER),
    };
  }

  let resArr = [];

  for (const key in grouped) {
    let obj = resArr.find((el) => el.name == key);
    if (!obj) {
      resArr.push({
        name: key,
        res: grouped[key],
      });
    }
  }

  return resArr;
};

const countElse = (arr) => {
  let resValue = 0,
    tmp,
    grouped;

  grouped = arr.reduce((acc, elem) => {
    if (!acc[elem.name]) {
      acc[elem.name] = [];
    }

    acc[elem.name].push(elem);
    return acc;
  }, {});

  for (const key in grouped) {
    tmp = 0;
    resValue = 0;
    grouped[key].forEach((el) => {
      tmp += el.ValueAvg / el.mpc_avrg_d;
      if (!isNaN(tmp) && tmp !== Infinity) {
        resValue += tmp;
      }
    });
    grouped[key] = {
      res: getResultLvl(resValue / grouped[key].length, DENGEROUS_LVL_DEFAULT),
    };
  }

  let resArr = [];

  for (const key in grouped) {
    let obj = resArr.find((el) => el.name == key);
    if (!obj) {
      resArr.push({
        name: key,
        res: grouped[key],
      });
    }
  }

  return resArr;
};

const CountersList = [
  {
    envirnonment: 1,
    countFunc: countAtmosphere,
  },
  {
    envirnonment: 2,
    countFunc: countWater,
  },
  {
    envirnonment: 3,
    countFunc: countWater,
  },
  {
    envirnonment: 4,
    countFunc: countElse,
  },
  {
    envirnonment: 5,
    countFunc: countElse,
  },
  {
    envirnonment: 6,
    countFunc: countWater,
  },
  {
    envirnonment: 8,
    countFunc: countElse,
  },
];

export const CountData = (idEnvironment, arr) => {
  const res = CountersList.find((el) => el.envirnonment == idEnvironment);
  if (res && arr?.length > 0) {
    return res.countFunc(arr);
  } else {
    return [];
  }
};
