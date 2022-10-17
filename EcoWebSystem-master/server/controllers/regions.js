const pool = require('../../db-config/mysql-config');

const { formatDateForDatabase } = require('../utils/formatDateForDatabase');

const pointInPolygon = require('point-in-polygon');

const mapPolygonPoints = (polygonPoints, idOfPolygon) => {
  return polygonPoints
    .filter(({ Id_of_poligon }) => Id_of_poligon === idOfPolygon)
    .map(({ latitude, longitude }) => [longitude, latitude]);
};

const getRegions = (req, res) => {
  let { idEnvironment, startDate, endDate } = req.query;

  startDate = formatDateForDatabase(startDate);
  endDate = formatDateForDatabase(endDate);

  const getPointsAndRegions = `
    SELECT DISTINCT poi.id, Coord_Lat, Coord_Lng FROM poi
        inner join emissions_on_map on poi.id = emissions_on_map.idPoi
        inner join environment on environment.id = emissions_on_map.idEnvironment or environment.AttachEnv = emissions_on_map.idEnvironment
        where (environment.id = ? or environment.AttachEnv = ?)  and  
        STR_TO_DATE(CONCAT(Year,'-',LPAD(Month,2,'00'),'-',LPAD(day,2,'00')), '%Y-%m-%d')  >= ? and 
        STR_TO_DATE(CONCAT(Year,'-',LPAD(Month,2,'00'),'-',LPAD(day,2,'00')), '%Y-%m-%d')  <= ?;
    SELECT 
        poligon.id_of_poligon,
        poligon.line_thickness,
        poligon.name,
        poligon.id_of_user,
        user.user_name,
        user.id_of_expert
    FROM poligon
        INNER JOIN user ON poligon.id_of_user = user.id_of_user
	WHERE poligon.type= "region";
    `;

  const getPointsOfRegions = `
        SELECT DISTINCT
            point_poligon.longitude,
            point_poligon.latitude,
            point_poligon.Id_of_poligon,
            point_poligon.order123
        FROM point_poligon
        INNER JOIN poligon on poligon.Id_of_poligon = point_poligon.Id_of_poligon
            where poligon.type="region"
        ORDER BY 
            point_poligon.Id_of_poligon ASC,
            point_poligon.order123 ASC;
    `;

  const getRegionsAndPointsPromise = new Promise((resolve, reject) => {
    pool.query(
      getPointsAndRegions,
      [idEnvironment, idEnvironment, startDate, endDate],
      (err, rows) => {
        if (err) {
          reject(err);
        }

        return resolve(rows);
      }
    );
  });

  const getPointsOfRegionsPromise = new Promise((resolve, reject) => {
    pool.query(getPointsOfRegions, [], (err, rows) => {
      if (err) {
        reject(err);
      }

      return resolve(rows);
    });
  });

  return Promise.all([getRegionsAndPointsPromise, getPointsOfRegionsPromise])
    .then(([RegionsAndPoints, regionsPoints]) => {
      return [
        RegionsAndPoints[0],
        RegionsAndPoints[1].map((region) => {
          const mappedPolygonPoints = mapPolygonPoints(
            regionsPoints,
            region.id_of_poligon
          );

          return {
            regionId: region.id_of_poligon,
            lineThickness: region.line_thickness,
            name: region.name,
            regionPoints: mappedPolygonPoints,
            id_of_user: region.id_of_user,
            user_name: region.user_name,
            id_of_expert: region.id_of_expert,
          };
        }),
      ];
    })
    .then((mappedObjects) => {
      mappedObjects[1].forEach((el) => {
        el.AttachedEmmissions = [];
        mappedObjects[0].forEach((point, i) => {
          if (
            pointInPolygon([point.Coord_Lat, point.Coord_Lng], el.regionPoints)
          ) {
            el.AttachedEmmissions.push(point.id);
            mappedObjects[0].splice(i, 1);
          }
        });
      });
      return mappedObjects[1];
    })
    .then((mappedObjects) => {
      let havingClause = '';
      let havingClauseRegions = '';
      let getEmissionsForPoints, getEmissionsForRegions;

      const mappedObjectsPromise = mappedObjects.map((el) => {
        if (el.AttachedEmmissions.length > 0) {
          havingClause = 'Having ';
          el.AttachedEmmissions.forEach((AtchPOI, i) => {
            havingClause +=
              el.AttachedEmmissions.length - 1 === i
                ? ` emissions_on_map.idPoi=${AtchPOI} `
                : ` emissions_on_map.idPoi=${AtchPOI} or `;
          });

          getEmissionsForPoints = `
                        SELECT emissions_on_map.idPoi,emissions_on_map.ValueAvg, gdk.mpc_avrg_d,gdk.mpc_m_ot, emissions_on_map.ValueMax,elements.name, gdk.code, gdk.danger_class FROM emissions_on_map
                            inner join environment on emissions_on_map.idEnvironment = environment.id or  emissions_on_map.idEnvironment = environment.AttachEnv
                            inner join gdk on gdk.code = emissions_on_map.idElement
                            inner join elements on emissions_on_map.idElement = elements.code
                            where environment.id = ? or environment.AttachEnv = ? and 
                        STR_TO_DATE(CONCAT(Year,'-',LPAD(Month,2,'00'),'-',LPAD(day,2,'00')), '%Y-%m-%d')  >= ? and 
                        STR_TO_DATE(CONCAT(Year,'-',LPAD(Month,2,'00'),'-',LPAD(day,2,'00')), '%Y-%m-%d')  <= ?
                        ${havingClause};
                    `;

          return new Promise((resolve, reject) => {
            pool.query(
              getEmissionsForPoints,
              [idEnvironment, idEnvironment, startDate, endDate],
              (err, rows) => {
                if (err) {
                  console.log(err);
                  reject(err);
                }

                resolve(rows);
              }
            );
          }).then((data) => ({
            ...el,
            AttachedEmmissions: data,
          }));
        } else {
          return new Promise((resolve, reject) => {
            resolve();
          }).then(() => ({ ...el }));
        }
      });

      const RegionsEmmisionsPromise = new Promise((resolve, reject) => {
        havingClauseRegions = ' and ( ';
        mappedObjects.forEach((el, i) => {
          havingClauseRegions +=
            mappedObjects.length - 1 === i
              ? ` emissions_on_map.idPoligon=${el.regionId} )`
              : ` emissions_on_map.idPoligon=${el.regionId} or `;
        });

        getEmissionsForRegions = `
                        SELECT 
                            emissions_on_map.idPoligon, 
                            emissions_on_map.ValueAvg, 
                            emissions_on_map.ValueMax,
                            elements.short_name, 
                            emissions_on_map.Year, 
                            emissions_on_map.Month, 
                            emissions_on_map.day, 
                            emissions_on_map.Measure
                        FROM emissions_on_map
                            inner join 
                                environment on emissions_on_map.idEnvironment = environment.id or  emissions_on_map.idEnvironment = environment.AttachEnv
                            inner join 
                                gdk on gdk.code = emissions_on_map.idElement
                            inner join 
                                elements on emissions_on_map.idElement = elements.code
                            where environment.id = ? or environment.AttachEnv = ? 
                            Having 
                                (STR_TO_DATE(CONCAT(Year,'-',LPAD(Month,2,'00'),'-',LPAD(day,2,'00')), '%Y-%m-%d')  >= ? and 
                                STR_TO_DATE(CONCAT(Year,'-',LPAD(Month,2,'00'),'-',LPAD(day,2,'00')), '%Y-%m-%d')  <= ?)
                                    ${havingClauseRegions};
                        `;

        pool.query(
          getEmissionsForRegions,
          [idEnvironment, idEnvironment, startDate, endDate],
          (err, rows) => {
            if (err) {
              console.log(err);
              reject(err);
            }

            resolve(rows);
          }
        );
      });

      Promise.all([RegionsEmmisionsPromise, ...mappedObjectsPromise]).then(
        ([RegionsEmmisions, ...mappedObjects]) => {
          res.send(
            mappedObjects.map((el) => {
              return {
                ...el,
                emmissions: RegionsEmmisions.filter(
                  (regEl) => regEl.idPoligon == el.regionId
                ),
              };
            })
          );
        }
      );
    });
};

module.exports = {
  getRegions,
};
