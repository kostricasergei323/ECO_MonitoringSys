const axi = require('axios');
const { default: Axios } = require('axios');

const pool = require('../../../db-config/mysql-config');

const replaceSymbol = (str) => {
  return str.replace(new RegExp("'", 'g'), "\\'");
};

function AddPoi(
  id_of_user,
  type,
  owner_type,
  coordinates,
  description,
  Name_object
) {
  let query = `insert into poi (id_of_user, Type, owner_type, Coord_Lat, Coord_Lng, Description , Name_object)
                   VALUES ('${id_of_user}', '${type}', '${owner_type}','${
    coordinates[0]
  }', '${coordinates[1]}', '${replaceSymbol(description)}', '${Name_object}');`;

  return query;
}

function AddEmmisionsOnMap(idName, pol, value, year, month, day, measure) {
  let query = `insert into emissions_on_map (idPoi,idElement,idEnvironment,ValueAvg,valueMax,year,month,day,measure)
                 VALUES ((select id from poi where Name_Object="${idName}"), "${pol}"  , 1 ,"${value}","${value}", "${year}","${month}", "${day}", "${measure}");`;
  return query;
}

async function LoadPoi_SaveEcoBotApi() {
  let data = await Axios.get('https://api.saveecobot.com/output.json').then(
    (response) => {
      return response.data;
    }
  );
  pool.query(
    `select * from poi where name_object like '%SAVEDNIPRO_%'`,
    (err, res) => {
      if (err) {
        console.log(err);
      } else {
        for (const itr of data) {
          if (
            !res.find(
              (el) =>
                (el.Coord_Lat == itr.latitude &&
                  el.Coord_Lng == itr.longitude) ||
                el.Name_object == itr.id
            )
          ) {
            pool.query(
              AddPoi(
                2,
                273,
                4,
                [itr.latitude, itr.longitude],
                itr.stationName,
                itr.id
              ),
              (err, result, field) => {
                if (err) {
                  console.log(err);
                }
              }
            );
          }
        }
      }
    }
  );
}

async function LoadPoiIssue_SaveEcoBotApi() {
  Axios.get('https://api.saveecobot.com/output.json').then((response) => {
    let data = response.data;
    pool.query(
      `select (select name_object from poi where Id=emissions_on_map.idPoi and name_object like '%SAVEDNIPRO_%')  as idPoi, idElement, ValueAvg, year, month, day from emissions_on_map where idPoi is not null`,
      async (err, rows) => {
        if (err) {
          console.log(err);
        } else {
          for (const itr of data) {
            for (const itr2 of itr.pollutants) {
              if (itr2.pol == 'PM2.5') {
                itr2.pol = 10;
              } else if (itr2.pol == 'PM10') {
                itr2.pol = 8;
              }
              if (
                rows.find(
                  (el) =>
                    el.idPoi == itr.id &&
                    el.idElement == itr2.pol &&
                    el.ValueAvg == (itr2.value / 1000).toFixed(5) &&
                    el.year == new Date(itr2.time).getFullYear() &&
                    el.month == new Date(itr2.time).getMonth() + 1 &&
                    el.day == new Date(itr2.time).getDate()
                ) == undefined &&
                (itr2.pol == 8 || itr2.pol == 10)
              ) {
                await pool.query(
                  AddEmmisionsOnMap(
                    itr.id,
                    itr2.pol,
                    (itr2.value / 1000).toFixed(5),
                    new Date(itr2.time).getFullYear(),
                    new Date(itr2.time).getMonth() + 1,
                    new Date(itr2.time).getDate(),
                    'mg/m3'
                  ),
                  (err, result, field) => {
                    if (err) {
                      console.log(err);
                    }
                  }
                );
              }
            }
          }
        }
      }
    );
    setTimeout(() => {
      pool.query(
        'delete from emissions_on_map where idPoi is null and idPoligon is null',
        (err) => {
          if (err) {
            console.log(err);
          }
          return false;
        }
      );
    }, 20000);
  });
}

//
//Для загрузки poi объектов использовать функцию LoadPoi_SaveEcoBotApi() , для загрузки загрязнений  LoadPoiIssue_SaveEcoBotApi();
//

module.exports = {
  LoadPoi_SaveEcoBotApi,
  LoadPoiIssue_SaveEcoBotApi,
};
