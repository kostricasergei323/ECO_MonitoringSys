const pool = require('../../db-config/mysql-config');

const iconsMapPromise = require('../utils/iconsMap')();

const { getEmissionsOnMap, SOURCE_POI } = require('./emissionsOnMap');

const { CountEmmisionCoif } = require('../utils/pointCoifCounter');

const { getActualDateTyped } = require('../utils/formatDateForDatabase');

const getPoints = (req, res) => {
  const { idEnvironment, startDate, endDate } = req.query;

  const query = `
  SELECT DISTINCT
    poi.Id,
    poi.id_of_user,
    poi.Coord_Lat,
    poi.Coord_Lng,
    poi.Description,
    poi.Name_object,
    poi.Type,
    type_of_object.id as Object_Type_Id,
    type_of_object.Name as Object_Type_Name,
    owner_type as owner_type_id, 
    owner_types.type as owner_type_name,
    user.id_of_expert
  FROM
    poi
  INNER JOIN
   type_of_object
  ON 
    poi.Type = type_of_object.id
  INNER JOIN 
    owner_types 
   ON 
    poi.owner_type = owner_types.id
  INNER JOIN 
    user 
  ON 
    poi.id_of_user = user.id_of_user
  INNER JOIN 
	  emissions_on_map 
  ON 
	  poi.Id = emissions_on_map.idPoi
  INNER JOIN 
    environment
  ON
     environment.id = emissions_on_map.idEnvironment or environment.AttachEnv = emissions_on_map.idEnvironment
  WHERE 
    environment.id = ${idEnvironment} or environment.AttachEnv = ${idEnvironment}
  ;`;

  //	  emissions_on_map.idEnvironment = ${idEnvironment}

  const pointsPromise = new Promise((resolve, reject) => {
    pool.query(query, (error, rows) => {
      if (error) {
        console.log(error);
        reject(error);
      }

      resolve(rows);
    });
  });

  return pointsPromise
    .then((points) => {
      const pointsPromises = points.map(
        async ({
          Id,
          id_of_user,
          id_of_expert,
          Type,
          Coord_Lat,
          Coord_Lng,
          Description,
          Name_object,
          Object_Type_Id,
          Object_Type_Name,
          owner_type_id,
          owner_type_name,
        }) => {
          const emissionsOnMapPromise = getEmissionsOnMap(
            SOURCE_POI,
            Id,
            idEnvironment,
            startDate == undefined && endDate == undefined ? 30 : undefined
          );
          const [emissions, iconsMap] = await Promise.all([
            emissionsOnMapPromise,
            iconsMapPromise,
          ]);
          return {
            Id,
            id_of_user,
            id_of_expert,
            owner_type: {
              id: owner_type_id,
              name: owner_type_name,
            },
            coordinates: [Coord_Lat, Coord_Lng],
            Description,
            Name_object,
            Image: iconsMap.get(+Type),
            Object_Type_Id,
            Object_Type_Name,
            Environments: req.query.env ? req.query.env : [],
            emissions:
              startDate == undefined &&
              endDate == undefined &&
              emissions.length > 0
                ? emissions.filter(
                    (el) =>
                      el.Year === emissions[0].Year &&
                      el.Month === emissions[0].Month &&
                      el.day === emissions[0].day
                  )
                : emissions.filter(
                    (el_1) =>
                      new Date(`${el_1.Year}-${el_1.Month}-${el_1.day}`) >=
                        new Date(startDate) &&
                      new Date(`${el_1.Year}-${el_1.Month}-${el_1.day}`) <=
                        new Date(endDate)
                  ),
            emmissionsStats: CountEmmisionCoif(emissions, startDate, endDate),
          };
        }
      );

      return Promise.all(pointsPromises).then((points) => res.send(points));
    })
    .catch((error) => {
      res.status(500).send({
        message: error,
      });
    });
};

const getAdvancedPoints = (req, res) => {
  let whereClause = {
    experts: '',
    env: '',
    issue: '',
  };
  if (req.query.env) {
    whereClause.env = 'and (';
    req.query.env.forEach((el, i) => {
      //whereClause.env+= (i==req.query.env.length-1)?`emissions_on_map.idEnvironment = ${el})`:`emissions_on_map.idEnvironment = ${el} or `
      whereClause.env +=
        i == req.query.env.length - 1
          ? `environment.id = ${el} or  environment.AttachEnv = ${el})`
          : `environment.id = ${el} or  environment.AttachEnv = ${el} or `;
    });
  }
  if (req.query.experts) {
    whereClause.experts = 'and (';
    req.query.experts.forEach((el, i) => {
      whereClause.experts +=
        i == req.query.experts.length - 1
          ? `user.id_of_expert = ${el})`
          : `user.id_of_expert = ${el} or `;
    });
  }
  if (req.query.issue) {
    whereClause.issue = 'and (';
    req.query.issue.forEach((el, i) => {
      whereClause.issue +=
        i == req.query.issue.length - 1
          ? `map_object_dependencies.id_of_ref = ${el});`
          : `map_object_dependencies.id_of_ref = ${el} or `;
    });
  }

  const query = `
  SELECT DISTINCT
    poi.Id,
    poi.id_of_user,
    poi.Coord_Lat,
    poi.Coord_Lng,
    poi.Description,
    poi.Name_object,
    poi.Type,
    type_of_object.id as Object_Type_Id,
    type_of_object.Name as Object_Type_Name,
    owner_type as owner_type_id, 
    owner_types.type as owner_type_name,
    user.id_of_expert
  FROM  poi
  INNER JOIN type_of_object  ON  poi.Type = type_of_object.id
  INNER JOIN owner_types  ON poi.owner_type = owner_types.id
  INNER JOIN user ON poi.id_of_user = user.id_of_user
  ${
    req.query.env
      ? `INNER JOIN emissions_on_map ON  poi.Id = emissions_on_map.idPoi
     INNER JOIN environment
      ON
     environment.id = emissions_on_map.idEnvironment or  environment.AttachEnv = emissions_on_map.idEnvironment`
      : ''
  }
  ${
    req.query.issue
      ? 'LEFT JOIN map_object_dependencies on poi.Id = map_object_dependencies.id_of_object'
      : ''
  }
  WHERE  poi.Id is not null
  ${whereClause.env}
  ${whereClause.experts}
  ${whereClause.issue}`;

  const pointsPromise = new Promise((resolve, reject) => {
    pool.query(query, (error, rows) => {
      if (error) {
        console.log(error);
        reject(error);
      }

      resolve(rows);
    });
  });

  return pointsPromise
    .then((points) => {
      const pointsPromises = points.map(
        ({
          Id,
          id_of_user,
          id_of_expert,
          Type,
          Coord_Lat,
          Coord_Lng,
          Description,
          Name_object,
          Object_Type_Id,
          Object_Type_Name,
          owner_type_id,
          owner_type_name,
        }) => {
          const emissionsOnMapPromise = getEmissionsOnMap(
            SOURCE_POI,
            Id,
            req.query.env ? req.query.env : null
          );
          return Promise.all([emissionsOnMapPromise, iconsMapPromise]).then(
            ([emissions, iconsMap]) => ({
              Id,
              id_of_user,
              id_of_expert,
              owner_type: {
                id: owner_type_id,
                name: owner_type_name,
              },
              coordinates: [Coord_Lat, Coord_Lng],
              Description,
              Name_object,
              Image: iconsMap.get(+Type),
              Object_Type_Id,
              Object_Type_Name,
              Environments: req.query.env ? req.query.env : [],
              emissions,
              emmissionsStats: CountEmmisionCoif(
                emissions,
                getActualDateTyped(),
                getActualDateTyped()
              ),
            })
          );
        }
      );

      return Promise.all(pointsPromises).then((points) => {
        res.send(points);
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send({
        message: error,
      });
    });
};

module.exports = {
  getPoints,
  getAdvancedPoints,
};
