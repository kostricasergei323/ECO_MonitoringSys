const pool = require('../../db-config/mysql-config');

const { CountEmmisionCoif } = require('../utils/pointCoifCounter');

const tableName = 'emissions_on_map';
const SOURCE_POI = 'poi';
const SOURCE_POLYGON = 'polygon';

const insertEmissionOnMap = (
  source,
  {
    idPoi,
    idElement,
    idEnvironment,
    valueAvg,
    valueMax,
    idPolygon,
    year,
    month,
    day,
    measure,
  }
) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO 
        ??
        (??)
      VALUES
        (?)`;

    const columnNames = [
      'idElement',
      'idEnvironment',
      'ValueAvg',
      'ValueMax',
      'Year',
      'Month',
      'day',
      'Measure',
    ];
    const values = [
      idElement,
      idEnvironment,
      valueAvg,
      valueMax,
      year,
      month,
      day,
      measure,
    ];
    if (source === SOURCE_POI) {
      columnNames.push('idPoi');
      values.push(idPoi);
    } else if (source === SOURCE_POLYGON) {
      columnNames.push('idPoligon');
      values.push(idPolygon);
    }

    pool.query(query, [tableName, columnNames, values], (error) => {
      if (error) {
        reject(error);
      }

      resolve();
    });
  });
};

const getEmissionsOnMap = (source, id, idEnvironment, limit) => {
  const filteringColumnName =
    source === SOURCE_POI
      ? 'idPoi'
      : source === SOURCE_POLYGON
      ? 'idPoligon'
      : undefined;
  const idEnvironmentClause =
    idEnvironment && Array.isArray(idEnvironment) && idEnvironment.length > 0
      ? `AND (environment.id IN (${idEnvironment}) OR environment.AttachEnv IN (${idEnvironment}))`
      : idEnvironment
      ? `AND (environment.id = ${idEnvironment} OR environment.AttachEnv = ${idEnvironment})`
      : '';

  return new Promise((resolve, reject) => {
    const columnNames = [
      'idElement',
      'idEnvironment',
      'ValueAvg',
      'ValueMax',
      'Year',
      'Month',
      'day',
      'emissions_on_map.Measure',
      'elements.short_name',
      'environment.name',
      'gdk.mpc_avrg_d',
      'gdk.mpc_m_ot',
    ];
    const query = `
      SELECT ??
      FROM ??
      INNER JOIN elements ON elements.code = emissions_on_map.idElement
      INNER JOIN environment ON (environment.id = emissions_on_map.idEnvironment OR environment.AttachEnv = emissions_on_map.idEnvironment)
      LEFT JOIN gdk ON gdk.code = emissions_on_map.idElement
      WHERE ?? = ?
      ${idEnvironmentClause}
      ORDER BY emissions_on_map.Year DESC, emissions_on_map.Month DESC, emissions_on_map.day DESC ${
        limit ? 'LIMIT ' + limit : ''
      };`;
    const values = [
      columnNames,
      tableName,
      filteringColumnName,
      id,
      'idEnvironment',
      idEnvironment,
    ];
    pool.query(query, values, (error, rows) => {
      if (error) {
        console.log(error);
        reject(error);
      }

      resolve(rows);
    });
  });
};

module.exports = {
  insertEmissionOnMap,
  SOURCE_POI,
  SOURCE_POLYGON,
  getEmissionsOnMap,
};
