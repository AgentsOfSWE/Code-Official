/*
 * File: GetApiGrafana.js
 * Creation date: 2019-02-07
 * Author: Marco Favaro
 * Type: ECMAScript 6
 * Author e-mail: marco.favaro.8@studenti.unipd.it
 * Version: 0.0.4
 *
 * Changelog:
 * 0.0.5 || Marco Favaro                  || 2019-02-25 || Ajax
 * 0.0.4 || Marco Favaro                  || 2019-02-19 || Add headers function
 * 0.0.3 || Marco Favaro                  || 2019-02-18 || Creato classe e fix
 * 0.0.2 || Marco Favaro                  || 2019-02-13 || Aggiunto ajax
 * 0.0.1 || Marco Favaro & Bogdan Stanciu || 2019-02-07 || Prima stesura
 */

import $ from "jquery";

/**
 *  Class representing a connection to Grafana API
 */
export class GetApiGrafana {
  /**
   * Create a connection
   * @param query - API that will return the requested information
   */
  constructor(host, query, port) {  // TODO: in produzione host verrà rimosso e rimpiazzato con 'localhost', idem per la porta che sarà 3000
    this.query = query;
    this.host = host;
    this.port = port;
    this.connectionURL = `http://${host}:${port}${query}`;
  }

  /**
   * The function returns a json file containing information related to grafana by API
   *  @async
   *  @returns {JSON} json file with response
   */
  async getData() {
    const response = await this.queryAPI();
    return response;
  }

  /**
   * The function send a request to Grafana API and return a Promise
   * @returns {Promise} Promise object represents the API response in JSON format
   */
  // Admin remote: eyJrIjoiVTVFZ0lkUENxQ2FKSGRYTEhUejRwVjVWcXBrVUNxN3IiLCJuIjoiQWRtaW4iLCJpZCI6MX0=
  queryAPI() {
    return $.get(this.connectionURL, {
      'Authorization': 'Bearer eyJrIjoiVTVFZ0lkUENxQ2FKSGRYTEhUejRwVjVWcXBrVUNxN3IiLCJuIjoiQWRtaW4iLCJpZCI6MX0=',
      'dataType': "jsonp"
    }, function (data) {
      return data;
    });
  }
}


/*
 const GrafanaConnection = new GetApiGrafana('localhost', '/api/datasources', '8080') ;
 GrafanaConnection.getData();
 /*.then( (x) => {
   x = JSON.parse(x);
   console.log(x[0]);
 }) ;
 */

