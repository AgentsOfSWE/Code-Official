/*
 * File: InfluxDBConnectionection.js
 * Creation date: 2019-02-26
 * Author: Marco Chilese
 * Type: ECMAScript 6
 * Author e-mail: marco.chilese@studenti.unipd.it
 * Version: 0.0.1
 *
 * Changelog:
 * 0.0.1 || Marco Chilese || 2019-02-26 || File development
 */

// curl -G 'http://142.93.102.115:8086/query?pretty=true' --data-urlencode "db=telegraf" --data-urlencode "q=SELECT * FROM \"cpu\" LIMIT 1"
// SELECT+total+FROM+processes+limit+1

import $ from 'jquery';

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

export class InfluxDBConnection {
    constructor(host, port, DB) {
        this.host = host;
        this.port = port;
        this.DB = DB;
    }

    parsedQuery(query) {
        const x = String(query).replaceAll(' ', '+');
        return String(query).replace(' ', '+');
    }

    /**
     * The function send a query to the DB through the established connection
     * @param query as a query string
     * @returns {Promise<IResults<any>[]> | Promise<IResults<any>>} the result of the query, in JSON format
     */
    async queryDB(query) {
        const queryURL = `http://${this.host}:${this.port}/query?pretty=true&db=${this.DB}&q=${this.parsedQuery(query)}`
        return $.get(queryURL);
    }

    /**
     * The function return a JSON with all the available tables in the current database
     * @return {Promise} contains JSON with all the available tables in the current database
     */
    async getDatasources() {
        const queryURL = `http://${this.host}:${this.port}/query?pretty=true&db=${this.DB}&q=show+measurements`;
        return $.get(queryURL);
    }

    /**
     * The function return a JSON with all the available fields for the required source in the current database
     * @param source: a table in the DB
     * @return {Promise} contains JSON with all the available fields for the required source in the current database
     */
    async getDatasourcesFields(source) {
        const queryURL = `http://${this.host}:${this.port}/query?pretty=true&db=${this.DB}&q=show+field+keys+from+${source}`;
        return $.get(queryURL);
    }


    /**
     * The function return the value of the last measurement of a particular field of a selected datasources
     * @param source: a table in the DB
     * @param field: a field in the source
     * @returns {Promise<*>} contains value of the last fetched value from the selected datasource
     */
    async getLastValue(source, field) {
        // select usage_system from cpu order by time desc limit 1
        const queryURL = `http://${this.host}:${this.port}/query?pretty=true&db=${this.DB}&q=select+${field}+from+${source}+order+by+time+desc+limit+1`;
        return $.get(queryURL);
    }

    buildWriteQuery(query, fieldsArray, valuesArray){
        if(fieldsArray.length !== valuesArray.length) throw Error('number of fields is not equal to number of values');
        for(let i = 0; i < fieldsArray.length; i++) {
            if (i+1 !== fieldsArray.length) query += `${fieldsArray[i]}=${valuesArray[i]},`;
            else query += `${fieldsArray[i]}=${valuesArray[i]}`;
        }
        return query;
    }

    /**
     * The function insert a value on particular field into a table on a DB
     * @param {String} tableName: the table to write on
     * @param {String} field: the particular field to insert value
     * @param {String} value: the value to insert into the field
     */
    async writeOnDB(tableName, field, value) {
        var queryToSend = `${tableName},host=server ${field}=${value}`;

        return $.ajax({
            url: `http://${this.host}:${this.port}/write?db=${this.DB}`,
            type: 'POST',
            contentType: 'application/octet-stream',
            data: queryToSend,
            processData: false
        });
    }

}


/*
const test = new InfluxDBConnection('142.93.102.115', '8086', 'telegraf');
test.queryDB('select usage_system from cpu order by time desc limit 1').then(x => console.log(x));
test.getDatasources().then(x => console.log(x));
test.getDatasourcesFields('mem').then(x => console.log(x));
test.getLastValue('processes', 'total').then(x => console.log(x));
test.writeOnDB('tullio2', 'pippo', '3').then(x => console.log(x));
*/
