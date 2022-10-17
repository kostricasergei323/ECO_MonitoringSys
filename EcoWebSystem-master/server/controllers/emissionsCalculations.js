const pool = require('../../db-config/mysql-config');

const { formatDateForDatabase } = require('../utils/formatDateForDatabase');

const getEmissionsCalculations = (req, res) => {
  const {
    idEnvironment,
    idPoi,
    idPolygon,
    envAttach,
    startDate: startDateISOString,
    endDate: endDateISOString,
  } = req.query;
  const typeOfObject = idPoi ? 'idPoi' : 'idPoligon';
  const id = idPoi || idPolygon;
  const shouldFilterByDates = startDateISOString && endDateISOString;

  let queryForFilteringByDates;
  let idEnvironmentClause;

  let innerLeftJoinClause;
  if (shouldFilterByDates) {
    const { stateDate, endDate } = {
      stateDate: formatDateForDatabase(startDateISOString),
      endDate: formatDateForDatabase(endDateISOString),
    };
    queryForFilteringByDates = `HAVING Formatted_Date >= '${stateDate}' and Formatted_Date <= '${endDate}'`;
  }

  if (idEnvironment == 'null' && envAttach) {
    // внешний where для отборки загрязнений
    idEnvironmentClause = 'AND (';
    envAttach.forEach((el, i) => {
      //idEnvironmentClause+= (i==envAttach.length-1)?`emissions_on_map.idEnvironment = ${el}) `:`emissions_on_map.idEnvironment = ${el} or `
      idEnvironmentClause +=
        i == envAttach.length - 1
          ? `environment.AttachEnv = ${el} or environment.id = ${el}) `
          : `environment.AttachEnv = ${el} or environment.id = ${el} or `;
    });

    // внутренний where для выборки gdk
    innerLeftJoinClause = 'WHERE ';
    envAttach.forEach((el, i) => {
      innerLeftJoinClause +=
        i == envAttach.length - 1
          ? ` environment.AttachEnv = ${el} or environment.id = ${el} `
          : ` environment.AttachEnv = ${el} or environment.id = ${el} or `;
    });
  } else if (idEnvironment != 'null') {
    idEnvironmentClause = ''; //` AND idEnvironment=${idEnvironment} `

    innerLeftJoinClause = ` WHERE environment.AttachEnv = ${idEnvironment} or environment.id = ${idEnvironment} `;
  } else {
    idEnvironmentClause = '';

    innerLeftJoinClause = '';
  }

  const query = `
    SELECT
      environment.name as envName,
      elements.short_name,
      idEnvironment,
      Year,
      Month,
      day,
      ValueAvg AS averageFromAverageEmissions,
      ValueMax AS maxFromMaximumEmissions,
      elements.Measure,
      gdk.mpc_avrg_d,
      gdk.mpc_m_ot,
      STR_TO_DATE(CONCAT(Year,'-',LPAD(Month,2,'00'),'-',LPAD(day,2,'00')), '%Y-%m-%d') as Formatted_Date
    FROM 
      emissions_on_map
    INNER JOIN elements ON emissions_on_map.idElement = elements.code
    LEFT JOIN environment on emissions_on_map.idEnvironment = environment.id or emissions_on_map.idEnvironment = environment.AttachEnv
    LEFT JOIN (
      select distinct gdk.code,gdk.mpc_m_ot,gdk.mpc_avrg_d,gdk.danger_class from gdk 
      left join environment on gdk.environment = environment.id or gdk.environment = environment.AttachEnv
              ${innerLeftJoinClause}
             ) as gdk ON emissions_on_map.idElement = gdk.code    
    WHERE 
      ${typeOfObject} = ${id}
      ${idEnvironmentClause}
      ${shouldFilterByDates ? queryForFilteringByDates : ''}
    ;
  `;

  return pool.query(query, [], (error, rows) => {
    if (error) {
      console.log(error);
      return res.status(500).send({
        message: error,
      });
    }

    const response = rows.map(
      ({
        short_name: shortName,
        idEnvironment,
        envName,
        Year,
        Month,
        day,
        averageFromAverageEmissions,
        maxFromMaximumEmissions,
        mpc_avrg_d: gdkAverage,
        mpc_m_ot: gdkMax,
        Measure: measure,
      }) => {
        return {
          element: shortName,
          idEnvironment,
          envName,
          date: {
            year: Year,
            month: Month,
            day,
          },
          averageCalculations: {
            average: averageFromAverageEmissions,
            gdkAverage,
          },
          maximumCalculations: {
            max: maxFromMaximumEmissions,
            gdkMax,
          },
          measure,
        };
      }
    );

    return res.send(JSON.stringify(response));
  });
};

module.exports = {
  getEmissionsCalculations,
};
