const CheckPointsPolygon = (Points, PolygonPoints) => {
  let resArr = [];
  let TMP = [];
  let TMPObject;

  Points.forEach((el, i) => {
    if (pointInPolygon(el.coordinates, PolygonPoints)) {
      resArr =
        resArr.length > 0
          ? [...resArr, ...el.emmissionsStats]
          : [...el.emmissionsStats];
      //Points.splice(i,1);
    }
  });

  resArr.forEach((el) => {
    if (!TMP.includes(el.short_name)) {
      TMP.push(el.short_name);
    }
  });

  return TMP.map((el) => {
    TMPObject = {
      short_name: null,
      coif: 0,
      ObjectsAmount: 0,
    };

    resArr.forEach((el2) => {
      if (el === el2.short_name && el2.coif != 0) {
        TMPObject.short_name = el2.short_name;
        TMPObject.coif += el2.coif;
        TMPObject.ObjectsAmount++;
      }
    });

    let AvgCof = (TMPObject.coif / TMPObject.ObjectsAmount).toFixed(5);

    TMPObject = {
      short_name: el,
      color: 'grey',
      coif: AvgCof,
    };

    if (AvgCof < 1) {
      TMPObject.color = 'grey';
    } else if (AvgCof < 1.5) {
      TMPObject.color = 'rgba(0, 200, 0, 1)';
    } else if (AvgCof < 2) {
      TMPObject.color = 'rgba(0, 110, 0, 1)';
    } else if (AvgCof < 2.5) {
      TMPObject.color = 'rgba(255, 255, 102,1)';
    } else if (AvgCof < 3) {
      TMPObject.color = 'rgba(179, 179, 0,1)';
    } else {
      TMPObject.color = 'rgba(242, 54, 7, 1)';
    }

    return TMPObject;
  });
};

module.exports = {
  CheckPointsPolygon,
};
