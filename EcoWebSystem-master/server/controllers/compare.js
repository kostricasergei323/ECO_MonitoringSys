const pool = require('../../db-config/mysql-config');

const { formatDateForDatabase } = require('../utils/formatDateForDatabase');

const getCompareInfo = (req, res) => {
  const {
    idEnvironment,
    PointsId,
    PolygonsId,
    startDate: startDateISOString,
    endDate: endDateISOString,
  } = req.query;

  const idClause = Array.isArray(idEnvironment)
    ? `emissions_on_map.idEnvironment in (${idEnvironment})`
    : `emissions_on_map.idEnvironment = ${idEnvironment}`;

  const query = `
    SELECT 
      ValueAvg,
      ValueMax,
      CONCAT(Year,"-",Month,"-",Day) as "DateEm",
      case
        when emissions_on_map.idPoi is null then poligon.name
        when emissions_on_map.idPoligon is null then poi.Name_Object 
      end as Name_Object,
      elements.Name as ElementName,
      emissions_on_map.Measure,
      STR_TO_DATE(CONCAT(Year,'-',LPAD(Month,2,'00'),'-',LPAD(day,2,'00')), '%Y-%m-%d') as Formatted_Date
    FROM emissions_on_map
      left join poi on poi.id=emissions_on_map.idpoi
      left join poligon on poligon.id_of_poligon=emissions_on_map.idPoligon
      left join elements on elements.code=emissions_on_map.idelement
      where (
        ${PointsId != undefined ? `IdPoi in (${PointsId})` : ''} 
          ${PointsId != undefined && PolygonsId != undefined ? ' or ' : ''}
        ${PolygonsId != undefined ? `IdPoligon in (${PolygonsId})` : ''}
        )  
      ${idClause ? ` AND ${idClause}` : ''}
      ${
        startDateISOString && endDateISOString
          ? `HAVING Formatted_Date >= '${formatDateForDatabase(
              startDateISOString
            )}' and Formatted_Date <= '${formatDateForDatabase(
              endDateISOString
            )}'`
          : ''
      }`;

  return pool.query(query, (err, rows) => {
    if (err) {
      console.log(err);
      return res.status(500).send({
        message: err,
      });
    }

    const resp = rows.map((props) => {
      return {
        ...props,
        visible: true,
      };
    });
    return res.send(resp);
  });
};

module.exports = {
  getCompareInfo,
};
