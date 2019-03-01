/*
 * File: InfluxDBConnectionection.js
 * Creation date: 2019-02-04
 * Author: Marco Chilese
 * Type: ECMAScript 6
 * Author e-mail: marco.chilese@studenti.unipd.it
 * Version: 0.0.8
 *
 * Changelog:
 * 0.0.9 || Marco Favaro  || 2019-02-20 || Added function wich build a map<node,value>
 * 0.0.8 || Marco Chilese || 2019-02-19 || Added function which gets the last value of a particular field
 * 0.0.7 || Marco Chilese || 2019-02-17 || Added function which gets all available datasources' name
 * 0.0.6 || Marco Chilese || 2019-02-17 || Improvement of class organization, added query function
 * 0.0.5 || Marco Chilese || 2019-02-06 || Improvement of class organization
 * 0.0.4 || Marco Chilese || 2019-02-06 || Improvement of class organization
 * 0.0.3 || Marco Chilese || 2019-02-05 || Improvement of class organization
 * 0.0.2 || Marco Chilese || 2019-02-05 || Definition in form of a class
 * 0.0.1 || Marco Chilese || 2019-02-04 || File development
 *
 * Useful links:
 * - https://node-influx.github.io/class/src/index.js~InfluxDB.html
 */

// const Influx = require('influx');

// import { Influx } from 'influx';

class InfluxDBConnection {
  constructor(user, password, host, port, DB) {
    this.user = user;
    this.password = password;
    this.host = host;
    this.port = port;
    this.DB = DB;
  }

  /* eslint no-console:0 */

  /**
   * The function test, with a ping, the connection established by the constructor
   *
   * @throws {Error} in case host is offline
   * @returns {boolean} true in case ping was successful
   */ testConnection() {
    this.connection.ping(5000).then((hosts) => {
      hosts.forEach((host) => {
        if (host.online) {
          // console.log(`${host.url.host} responded in ${host.rtt}ms running ${host.version})`);
        /* eslint no-else-return:0 */
        } else {
          // console.log(`${host.url.host} is offline :(`);
          throw new Error('Host is Offline');
        }
      });
    });
    return true;
  }

  /**
   * The function make the connection with the DB and then test the connection
   * @throws {Error} in case host is offline
   * @returns {boolean} true in case ping was successful
   */
  connect() {
    const connectionURL = `http://${this.user}:${this.password}@${this.host}:${this.port}/${this.DB}`;
    this.connection = new Influx.InfluxDB(connectionURL);

    return this.testConnection();
  }

  /**
   * The function return the current connection to InfluxDB
   * @returns {Influx.InfluxDB|InfluxDB}
   */
  getConnection() {
    return this.connection;
  }

  /**
   * The function send a query to the DB through the established connection
   * @param sql as a query string
   * @throws {Error} if error happens while trying to test connection
   * @returns {Promise<IResults<any>[]> | Promise<IResults<any>>} the result of the query, in JSON format
   */
  queryToDB(sql) {
    if (this.testConnection() === true) return this.connection.query(sql);
  }

  /**
   * The function return a JSON with all the measurements available in the current database
   * @throws {Error} if error happens while trying to test connection
   * @throws {Error} if error happens while trying to parse string to JSON
   * @return {Promise} contains JSON with all the measurements available in the current database
   *
   * please read the usage example under the class declaration
   */
  async getDatasources() {
    const response = await this.queryToDB('show measurements');

    let tables = '{';
    for (let i = 0; i < response.length; i++) {
      tables += `\"${response[i].name}\":[`;
      const fields = await this.queryToDB(`show field keys from ${response[i].name}`);
      for (let j = 0; j < fields.length; j++) {
        if (j + 1 !== fields.length) tables += `\"${fields[j].fieldKey}\", `;
        else tables += `\"${fields[j].fieldKey}\"`;
      }
      if (i + 1 !== response.length) tables += '],';
      else tables += ']';
    }

    tables += '}';

    try {
      return JSON.parse(tables);
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * The function return the value of the last measurement of a particular field of a selected datasources
   * @param source: a table in the DB
   * @throws {Error} if error happens while trying to test connection
   * @param field: a field in the source
   * @returns {Promise<*>} contains value of the last fetched value from the selected datasource
   */
  async getLastValue(source, field) {
    const response = await this.queryToDB(`select ${field} from ${source} limit 1`);
    return response[0][field];
  }

  /**
   * TODO: Aspettare dati dal frontend
   *  @async
   *  @param  source: data source
   *  @returns {map<field|value>} contains a map of value request from frontend
   */
  async getMapLastValue(source){
    let map = new Map();
    const tables = await db.queryToDB('show measurements');
    const field = await db.getDatasources();

    // console.log(tables);
    // console.log(field);
    /* Esempio costruzione mappa
    for (var i = 0; i < source.length ; i ++) {
      map.set(chiave,getLastValue()); //TODO
    }
    */

    map.set(field.cpu[0],await db.getLastValue(tables[0].name,field.cpu[0]));
    map.set(field.disk[0],await db.getLastValue(tables[1].name,field.disk[0]));
    map.set(field.diskio[0],await db.getLastValue(tables[2].name,field.diskio[0]));
    map.set(field.kernel[0],await db.getLastValue(tables[3].name,field.kernel[0]));

    console.log(map);
    return map;
  }
}



/* EXAMPLE USAGE GetApiGrafana

const GetAPIGrafana = require('../APIgrafana/GetApiGrafana.js');

let resp = '';

const GrafanaConnection = new GetAPIGrafana('142.93.102.115', '/api/datasources', '3000');
GrafanaConnection.getData()
  .then((x) => {
    resp = JSON.parse(x);
    /* resp contiene il json ritornato da api grafana
     * TEST: console.log(resp);
     *//*
  }).catch( (error) => {
    console.log(error,'Promise Error - see GetApiGrafana.js');
});
*/



/* ======================================================================================================
 * EXAMPLE OF USAGE getDatasources:
 * const test = new InfluxDBConnection('greg', 'greg', '142.93.102.115', '8086', 'telegraf');
 * test.connect();
 * test.getDatasources().then(x => console.log(x));
 *
 * EXAMPLE OF USAGE getLastValue:
 * const test = new InfluxDBConnection('greg', 'greg', '142.93.102.115', '8086', 'telegraf');
 * test.connect();
 * test.getLastValue('cpu', 'usage_system').then(x => console.log(x));
 * ======================================================================================================
 */
 module.exports = InfluxDBConnection;
