const CountEmmisionCoif = (Emmisions_, startDate, endDate) => {
  let Emmisions =
    startDate == undefined && endDate == undefined
      ? Emmisions_.filter(
          (el) =>
            el.Year === Emmisions_[0].Year &&
            el.Month === Emmisions_[0].Month &&
            el.day === Emmisions_[0].day
        )
      : Emmisions_.filter(
          (el) =>
            new Date(`${el.Year}-${el.Month}-${el.day}`) >=
              new Date(startDate) &&
            new Date(`${el.Year}-${el.Month}-${el.day}`) <= new Date(endDate)
        );

  if (Emmisions.length == 0) return [];

  const TMP = Emmisions.reduce(
    (prev, next) =>
      prev.includes(next.short_name) ? prev : [...prev, next.short_name],
    []
  );
  let TMPObject;

  return TMP.map((el) => {
    TMPObject = {
      short_name: null,
      gdkAvg: 0,
      gdkMax: 0,
      gdkAvgS: null,
      gdkMaxS: null,
      ObjectsAmount: 0,
    };
    Emmisions.forEach((el2) => {
      if (el === el2.short_name && el2.mpc_avrg_d && el2.mpc_m_ot) {
        TMPObject.short_name = el;
        TMPObject.gdkAvgS = el2.mpc_avrg_d;
        TMPObject.gdkMaxS = el2.mpc_m_ot;
        TMPObject.gdkAvg += el2.ValueAvg;
        TMPObject.gdkMax += el2.ValueMax;
        TMPObject.ObjectsAmount++;
      }
    });

    let PreCofMax = TMPObject.gdkMax / TMPObject.ObjectsAmount;
    let PreCofAvg = TMPObject.gdkAvg / TMPObject.ObjectsAmount;

    if (
      isNaN(PreCofMax) ||
      isNaN(PreCofAvg) ||
      PreCofMax == Infinity ||
      PreCofAvg == Infinity
    ) {
      PreCofMax = undefined;
      PreCofAvg = undefined;
    }

    if (PreCofAvg < TMPObject.gdkAvgS && PreCofMax < TMPObject.gdkMaxS) {
      TMPObject = {
        short_name: el,
        color: '#3ede49',
        coif: 1,
      };
    } else if (PreCofAvg > TMPObject.gdkAvgS && PreCofMax < TMPObject.gdkMaxS) {
      TMPObject = {
        short_name: el,
        color: 'yellow',
        coif: 2,
      };
    } else if (PreCofMax > TMPObject.gdkMaxS) {
      TMPObject = {
        short_name: el,
        color: 'red',
        coif: 3,
      };
    } else {
      TMPObject = {
        short_name: el,
        color: 'grey',
        coif: 0,
      };
    }

    return TMPObject;
  });
};

module.exports = {
  CountEmmisionCoif,
};
