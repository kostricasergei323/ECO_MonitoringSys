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

  const query = `
    SELECT
      environment.name AS envName,
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
      STR_TO_DATE(CONCAT(Year,'-',LPAD(Month,2,'00'),'-',LPAD(day,2,'00')), '%Y-%m-%d') AS Formatted_Date
    FROM emissions_on_map
    INNER JOIN elements ON emissions_on_map.idElement = elements.code
    LEFT JOIN environment ON (emissions_on_map.idEnvironment = environment.id OR emissions_on_map.idEnvironment = environment.AttachEnv)
    LEFT JOIN (
      SELECT DISTINCT gdk.code, gdk.mpc_m_ot, gdk.mpc_avrg_d, gdk.danger_class 
      FROM gdk 
      LEFT JOIN environment ON (gdk.environment = environment.id OR gdk.environment = environment.AttachEnv)
      ${
        idEnvironment === 'null' && envAttach
          ? `WHERE (environment.AttachEnv IN (${envAttach}) OR environment.id IN (${envAttach}))`
          : idEnvironment !== 'null'
          ? `WHERE environment.AttachEnv = ${idEnvironment} OR environment.id = ${idEnvironment}`
          : ''
      }
             ) AS gdk ON emissions_on_map.idElement = gdk.code    
    WHERE 
      ${idPoi ? 'idPoi' : 'idPoligon'} = ${idPoi || idPolygon}
      ${
        idEnvironment === 'null' && envAttach
          ? `AND (environment.AttachEnv IN (${envAttach}) OR environment.id IN (${envAttach}))`
          : ''
      }
      ${
        startDateISOString && endDateISOString
          ? `HAVING Formatted_Date >= '${formatDateForDatabase(
              startDateISOString
            )}' AND Formatted_Date <= '${formatDateForDatabase(
              endDateISOString
            )}'`
          : ''
      };`;

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
