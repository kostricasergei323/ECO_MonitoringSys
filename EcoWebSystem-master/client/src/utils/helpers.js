import { resolve } from 'path';
import pointInPolygon from 'point-in-polygon';

export const transformEmissions = (emissions) => {
  const elementIds = [...new Set(emissions.map(({ idElement }) => idElement))];

  // {
  //     [element]: { [Year]: { [Month]: { avg: ValueAvg, max: ValueMax } } }
  // }
  let transformedData = {};

  emissions.forEach(({ idElement, ValueAvg, ValueMax, Year, Month }) => {
    elementIds.forEach((elementId) => {
      if (elementId === idElement) {
        if (transformedData[elementId]) {
          if (transformedData[idElement][Year]) {
            if (transformedData[idElement][Year][Month]) {
              const { avg, max } = transformedData[idElement][Year][Month];

              transformedData[idElement][Year][Month] = {
                avg: ValueAvg + avg,
                max: ValueMax + max,
              };
            } else {
              transformedData[idElement][Year][Month] = {
                avg: ValueAvg,
                max: ValueMax,
              };
            }
          } else {
            transformedData[idElement][Year] = {
              [Month]: { avg: ValueAvg, max: ValueMax },
            };
          }
        } else {
          transformedData[idElement] = {
            [Year]: { [Month]: { avg: ValueAvg, max: ValueMax } },
          };
        }
      }
    });
  });

  return transformedData;
};

export const formatMonthDataForBarChart = (
  transformedEmissions,
  elementId,
  year
) =>
  transformedEmissions &&
  elementId &&
  year &&
  Object.keys(transformedEmissions[elementId][year]).map((month) => ({
    month,
    average: transformedEmissions[elementId][year][month].avg,
    max: transformedEmissions[elementId][year][month].max,
  }));

export const getElementName = (emissions, emissionId) => [
  ...new Set(
    emissions
      .filter(({ idElement }) => Number(emissionId) === idElement)
      .map(({ short_name }) => short_name)
  ),
];

export const removeObjectDuplicates = (items, prop) =>
  items.filter(
    (obj, index, arr) =>
      arr.map((mapObj) => mapObj[prop]).indexOf(obj[prop]) === index
  );

export const findAverageForEmissionCalculations = (emissionCalculations) => {
  const elementNames = [];

  emissionCalculations.forEach((emission) => {
    if (!elementNames.includes(emission.element)) {
      elementNames.push(emission.element);
    }
  });

  return elementNames.map((name) => {
    let temp = { name, quantity: 0, total: 0 };

    emissionCalculations.forEach((emission) => {
      if (temp.name === emission.element) {
        temp.total += emission.averageCalculations.average;
        temp.quantity++;
      }
    });

    return {
      name: temp.name,
      value: temp.total / temp.quantity,
    };
  });
};

export const findMaxForEmissionCalculations = (emissionCalculations) => {
  const elementNames = [];

  emissionCalculations.forEach((emission) => {
    if (!elementNames.includes(emission.element)) {
      elementNames.push(emission.element);
    }
  });

  return elementNames.map((name) => {
    let temp = { name, value: 0 };

    emissionCalculations.forEach((emission) => {
      if (temp.name === emission.element) {
        if (emission.maximumCalculations.max > temp.value) {
          temp.value = emission.maximumCalculations.max;
        }
      }
    });

    return temp;
  });
};

export const formatEmissionsLineChart = (emissionCalculations) => {
  const elementNames = [];

  emissionCalculations.forEach((emission) => {
    if (!elementNames.includes(emission.element)) {
      elementNames.push(emission.element);
    }
  });

  return elementNames.reduce((obj, name) => {
    const temp = [];
    emissionCalculations.forEach((emission) => {
      if (name === emission.element) {
        temp.push({
          name: `${emission.date.day}-${emission.date.month}-${emission.date.year}`,
          'Середнє значення': emission.averageCalculations.average,
          'Максимальне значення': emission.maximumCalculations.max,
        });
      }
    });
    obj[name] = temp;

    return obj;
  }, {});
};

export const extractRGBA = (rgbaString) => {
  try {
    if (!/rgba/gi.test(rgbaString)) {
      throw new Error('Неправильний формат для кольору');
    }

    const colors = rgbaString
      .match(/\d*\.?\d+/gi)
      .map((colorValue) => +colorValue);

    if (colors.length !== 4) {
      throw new Error('Кольори заповнені неправильно');
    }

    const [r, g, b, a] = colors;

    return {
      r,
      g,
      b,
      a,
    };
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};

export const randGraphColor = () => {
  var r = Math.floor(Math.random() * 256),
    g = Math.floor(Math.random() * 256),
    b = Math.floor(Math.random() * 256);
  return '#' + r.toString(16) + g.toString(16) + b.toString(16);
};

export const getIdColumnNameForDictionaryObject = (item) => {
  const possibleNamesForIdColumn = ['code', 'id', 'Id', 'id_of_element'];

  return possibleNamesForIdColumn.find((possibleName) =>
    Object.keys(item).some((key) => key === possibleName)
  );
};

export const transformCalculationDate = (date) => {
  return `${date.getDate()}/${
    date.getMonth() + 1
  }/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
};

export const formParamsForGetCheckbox = (arr, label) => {
  let query = '';
  arr.forEach((el, i) => {
    query +=
      i == arr.length - 1
        ? `${label}[]=${el.value}`
        : `${label}[]=${el.value}&`;
  });
  return query;
};

export const formParamsForGetArr = (arr, label) => {
  let query = '';
  arr.forEach((el, i) => {
    query += i == arr.length - 1 ? `${label}[]=${el}` : `${label}[]=${el}&`;
  });
  return query;
};

export const removeDuplicates = (arr) => {
  const result = [];
  const duplicatesIndices = [];

  // Перебираем каждый элемент в исходном массиве
  arr.forEach((current, index) => {
    if (duplicatesIndices.includes(index)) return;

    result.push(current);

    // Сравниваем каждый элемент в массиве после текущего
    for (
      let comparisonIndex = index + 1;
      comparisonIndex < arr.length;
      comparisonIndex++
    ) {
      const comparison = arr[comparisonIndex];
      const currentKeys = Object.keys(current);
      const comparisonKeys = Object.keys(comparison);

      // Проверяем длину массивов
      if (currentKeys.length !== comparisonKeys.length) continue;

      // Проверяем значение ключей
      const currentKeysString = currentKeys.sort().join('').toLowerCase();
      const comparisonKeysString = comparisonKeys.sort().join('').toLowerCase();
      if (currentKeysString !== comparisonKeysString) continue;

      // Проверяем индексы ключей
      let valuesEqual = true;
      for (let i = 0; i < currentKeys.length; i++) {
        const key = currentKeys[i];
        if (current[key] !== comparison[key]) {
          valuesEqual = false;
          break;
        }
      }
      if (valuesEqual) duplicatesIndices.push(comparisonIndex);
    } // Конец цикла
  });
  return result;
};
