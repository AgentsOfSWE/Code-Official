/*
 * File: hello_ctrl.js
 * Creation date: 2019-02-22
 * Author: Bogdan Stanciu
 * Type: JS6
 * Author e-mail: bogdan.stanciu@studenti.unipd.it
 * Version: 0.0.1
 *
 * Changelog:
 * 0.0.4 || Diego Mazzalovo || 2019-02-25 || Fixing metodi GrafanaAPI v5.0
 * 0.0.3 || Bogdan Stanciu  || 2019-02-23 || Integrazioni componenti InfluxHTTP & html elements angular methods
 * 0.0.2 || Bogdan Stanciu  || 2019-02-23 || Implementazione salvataggio/caricamento rete from LocalStorage
 * 0.0.1 || Bogdan Stanciu  || 2019-02-22 || Creazione controller
 */

import { PanelCtrl } from 'grafana/app/plugins/sdk';
import { QueryCtrl } from 'grafana/app/plugins/sdk';
import { InfluxDBConnection } from './js/InfluxHTTP';
import { NetworkCreator } from './js/NetworkCreator';
import _ from 'lodash';

// TODO: Invece di fare la classe considerarlo come dizionaro ? o json
// La classe pesa di piu in memoria rispetto a un json obj o dict
class treshold {

	constructor (state,sign,number,critical,name) {
		// Stato soglia associato al nodo
		this.state = state;
		// segno della soglia
		this.sign = sign;
		// Valore della soglia
		this.number = number;
		// Valore critico
		this.critical = critical;
		this.name = name;
	}

}

/*
class QueryMia extends QueryCtrl{

	constructor($scope, $injector) {
		super($scope, $injector);
	}

	getTable(){
		console.log(this);
	}
}
*/


export class HelloCtrl extends PanelCtrl {

	/** @ngInject **/
	constructor($scope, $injector, backendSrv) {

		super($scope, $injector);
		this.backendSrv = backendSrv;
		this.dashboard.refresh = "3s";
		// valori definiti di default per AngularJS
		var panelDefaults = {
			file: 'reteBayesiana',
			bgColor: null,
			nodes: [],
			reteBayesiana: '',
			numberOfTresholds: 0,
			tresholds: {},
			back: null,
			sorgentiDati: [],
			nodiSelezionati: [],
			calculatedProbabilities: [],
			sorgentiDatiSelezionati: [],
			actualFlux: null,
			fluxesAssociations: {},
			collegatoAlDB: false,
			states: {},
			parents: {},
			probabilities: {},
			elementsToObserve: [],
			source: {},
			selectedDB: null,
			tables: {},
			flussi: [],
			flussiDati: [],
			temporalPolitic: 3000,
			temporalPoliticMesure: 'Seconds',
			monitoring: undefined,
		};



		this.initNodes();
		this.initFlussoDati();

		// this.back = new QueryMia($scope, $injector);
		// this.panel.back = new QueryMia($scope, $injector);

		_.defaults(this.panel, panelDefaults);
		this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
		// $scope.$apply();
	}


	onInitEditMode() {
		// TODO: scoprire cosa significa il 2 finale.
		this.addEditorTab('Collegamento Nodi', `/public/plugins/${this.pluginId}/` + 'partials/collegamento.html', 3);
	}


	initFlussoDati(){
		this.backendSrv.get('/api/datasources').then(data => {
			for(let i in data){
				this.panel.source[data[i].name] = data[i];
			}
		});
	}



	initNodes(){
		// Controllo se esistono già i nodi in localStorage per caricarli
		// TODO: sostituire questo metodo con una versione aggiornata di salvataggio/loading della rete
		let check = window.localStorage.getItem('nodiRete');
		let rete = window.localStorage.getItem('reteBayesiana');


		if(check !== null && check !== undefined){
			this.panel.nodes = [];
			this.panel.nodes = check.split(",");
		}
		else{}

		if(rete != null && rete != undefined){
			this.reteBayesiana = JSON.stringify(rete);
			// TODO: DA VEDERE DOPO
			// this.loadNetwork(JSON.parse(this.reteBayesiana));
		}
		else{}
	}


	// TODO: da commentare
	loadNetwork(data){
		// data e già un json caricato da <file> il quale vuole solo json

		window.localStorage.removeItem('nodiRete');
		window.localStorage.setItem('nodiRete', data.nodes.join(","));

		window.localStorage.setItem('reteBayesiana', JSON.stringify(data));
		this.reteBayesiana = JSON.parse(JSON.stringify(data));

		this.nodes = [];
		// slice() una sorta di copia profonda per gli array
 		this.nodes = data.nodes;

		// crea la rete
		this.net = new NetworkCreator(data);

		this.panel.nodes = this.net.nodes;

		for(const el in this.net.nodes) {

			this.panel.calculatedProbabilities.push({});

			this.panel.calculatedProbabilities[el].node = this.net.nodes[el];

			this.panel.calculatedProbabilities[el].prob = 0;

			this.panel.states[this.net.nodes[el]] = [];

			for(const state in this.net.states[el]) this.panel.states[this.net.nodes[el]].push(this.net.states[el][state]);
			this.panel.parents = this.net.parents;
			this.panel.probabilities = this.net.probabilities;
		}

		// minimum number of tresholds for each state
		this.panel.tresholds = {};

		for (const n in this.net.nodes) {
			this.panel.tresholds[this.net.nodes[n]] = [];
		}



	}

	deleteLinkToFlux(node){
		if(this.panel.fluxesAssociations[node] !== undefined) {
			this.panel.flussi.push(this.panel.fluxesAssociations[node]);
			delete this.panel.fluxesAssociations[node];
		}
	}

	deleteTreshold(node, name) {
		this.panel.numberOfTresholds--;
		if(this.panel.tresholds[node].length === 1){
			this.panel.tresholds[node] = [];
			this.deleteLinkToFlux(node);
			return;
		}
		for (const el in this.panel.tresholds[node])
			if(this.panel.tresholds[node][el].name === name) {
				this.panel.tresholds[node].splice(el, 1);
				return true;
			}
	}

	addTreshold(node, state) {
		this.panel.tresholds[node].push(new treshold(state,'>=',0,false,this.panel.tresholds[node].length));
		this.panel.numberOfTresholds++;
	}


	confirmTresholdsChanges(node){

		console.log(this.panel.tresholds);

		// controllo se il nodo e già associato a un flusso
		if(this.panel.fluxesAssociations[node] !== undefined){
			this.panel.error = "node already to flux: " + this.panel.fluxesAssociations[node];
		}
		else if(this.panel.monitoring === undefined && this.panel.actualFlux !== null){
			// maggiore uguale
			const maj = [];
			// Minore
			const min = [];

			// scorro tutti i threasholds per il nodo corrente
			for(let el = 1; el < this.panel.tresholds[node].length; el++){

				// Controllo se non sono stati ripetuti i valori inseriti precedetemente
				if (this.panel.tresholds[node][el].number === this.panel.tresholds[node][el - 1].number &&
					this.panel.tresholds[node][el].sign === this.panel.tresholds[node][el - 1].sign) {
						this.panel.error = 'cannot declare two times same treshold';
						this.panel.canStartComputation = false;
						return false;
				}
			}

			// Divido le soglie negli array di maggiore_uguale e minore
			for(const el in this.panel.tresholds[node]){
				if(this.panel.tresholds[node][el].sign === ">=")
					maj.push(this.panel.tresholds[node][el]);
				else
					min.push(this.panel.tresholds[node][el]);
			}

			// controllo se si incrociano i minori con i maggiori
			for (const mi in min){
				for(const ma in maj){
					if(min[mi].number > maj[ma].number){
						this.panel.error = "cannot declare both tresholds : < " + min[mi].number + " and >= " + maj[ma].number;
						this.panel.canStartComputation = false;
						return false;
					}
				}
			}

			// Ordino in senso crescente
			this.panel.tresholds[node].sort(function (a, b) { return a.number - b.number; });

			// creo l'associazione tra nodo e flusso dati
			this.panel.fluxesAssociations[node] = this.panel.actualFlux;

			// Controllo se posso iniziare la computazione
			this.panel.canStartComputation = true;

			// Rimuovo quello collegato per non selezionarlo una seconda volta
			this.panel.flussi.splice(this.panel.flussi.indexOf(this.panel.actualFlux),1);

			this.panel.error = '';

			return true;
		}

	}

	// TODO: rileggere, per ora mi fido di Diego Mazzalovo (<3)
	observeData() {
		// unobserve all nodes
		for (const el in this.panel.nodes) this.net.unobserve(this.panel.nodes[el]);
		// check properly treshold
		for (const el in this.panel.elementsToObserve) {
			let source;
			for (const e in this.panel.tables) {
				if (this.panel.tables[e].includes(this.panel.fluxesAssociations[this.panel.elementsToObserve[el]])) {
					source = e;
					break;
				}
			}
			let data = this.db.getLastValue(source, this.panel.fluxesAssociations[this.panel.elementsToObserve[el]]).then((x) => {
				const min = [];
				const maj = [];
				for (const tr in this.panel.tresholds[this.panel.elementsToObserve[el]])
					if (this.panel.tresholds[this.panel.elementsToObserve[el]][tr].sign === "<")
						min.push(this.panel.tresholds[this.panel.elementsToObserve[el]][tr]);
					else
						maj.push(this.panel.tresholds[this.panel.elementsToObserve[el]][tr]);
				maj.sort(function (a, b) {
					return b.number - a.number;
				});
				let observed = false;
				let value = x.results[0].series[0].values[0][1];
				for (const m in min) if (value < min[m].number) {
					this.net.observe(this.panel.elementsToObserve[el], min[m].state);
					observed = true;
					break;
				}
				if (observed === false)
					for (const m in maj) if (value >= maj[m].number) {
						this.net.observe(this.panel.elementsToObserve[el], maj[m].state);
						break;
					}
				this.net.sample(10000);
				for (const e in this.net.nodes) {
					this.db.writeOnDB('testing', this.net.nodes[e].replaceAll(' ','_'), this.net.graph.node(this.net.nodes[e]).probs()[0]);
					this.panel.calculatedProbabilities[e].prob = this.net.graph.node(this.net.nodes[e]).probs();
				}
			});
		}
	}





	getFluxes(){

		// console.log(this.panel.flussiDati);
		const tmp = this.panel.source[this.panel.selectedDB];

		this.db = new InfluxDBConnection(tmp.url.substring(7, tmp.url.length - 5), tmp.url.substring(tmp.url.length - 4, tmp.url.length), tmp.database);
		this.db.getDatasources().then(data => {




				for(const el in data.results[0].series[0].values){


					this.db.getDatasourcesFields(data.results[0].series[0].values[el]).then((c) => {
						this.panel.tables[c.results[0].series[0].name] = [];
						for (const e in c.results[0].series[0].values) {
							this.panel.flussiDati.push(c.results[0].series[0].values[e][0]);
							this.panel.tables[c.results[0].series[0].name].push(c.results[0].series[0].values[e][0]);
						}
					})
				}

		});
	}


/*

	getFluxes() {


		if (this.panel.selectedDB !== null) {

			// TESTING
			console.log(this.panel.source[this.panel.selectedDB]);

			if (this.panel.source[this.panel.selectedDB].type === 'influxdb') {

				const db = this.panel.source[this.panel.selectedDB];



				this.db = new InfluxDBConnection(db.url.substring(7, db.url.length- 5), db.url.substring(db.url.length - 4, db.url.length), db.database);

				this.db.getDatasources().then((x) => {

					if(this.panel.collegatoAlDB !== true) {
						console.log(x.results[0]);
						for (const el in x.results[0].series[0].values) {

							console.log(x.results[0].series[0].values[el]);

							this.db.getDatasourcesFields(x.results[0].series[0].values[el]).then((c) => {
								this.panel.tables[c.results[0].series[0].name] = [];
								for (const e in c.results[0].series[0].values) {
									this.panel.flussiDati.push(c.results[0].series[0].values[e][0]);
									this.panel.tables[c.results[0].series[0].name].push(c.results[0].series[0].values[e][0]);
								}


							});
						}

					}
					this.panel.error = "";
					this.panel.collegatoAlDB = true;

					console.log(this.panel.flussiDati);

				});
			}

		}
		else{
			this.panel.error = "No db selected";
			console.error('No db selected');
		}
	}
	*/


	startComputation(){
		// controllo se posso effetivamente iniziare il monitoraggio
		if(this.panel.numberOfTresholds !== 0 && this.panel.canStartComputation === true && this.panel.collegatoAlDB === true){
			this.panel.elementsToObserve = [];

			// Aggiungo i nodi da dover controllare
			for(const tresh in this.panel.tresholds)
				if(this.panel.tresholds[tresh].length !== 0)
					this.panel.elementsToObserve.push(tresh);

			let num = this.panel.temporalPolitic;

			// Trasformo in secondi il valore inserito
			if(this.panel.temporalPoliticMesure === 'Minutes')
				num *= 60;

			else if(this.panel.temporalPoliticMesure === 'Hours')
				num *= 3600;
			// Richiamo quella funzione ogni tot secondi
			this.panel.monitoring = setInterval(this.observeData.bind(this), num);

			// imposto a false poiche e gia partita TODO: da sistemare il commento
			this.panel.canStartComputation = false;
		}
	}

	closeComputation(){
		// un-bind la funzione
		clearInterval(this.panel.monitoring);
		// Set a null (libero lo slot)
		this.panel.monitoring = undefined;
		// unlock the lock
		this.panel.canStartComputation = true;
	}


	get panelPath() {
		if (this._panelPath === undefined){
			this._panelPath = `/public/plugins/${this.pluginId}/`;
		}
		return this._panelPath;
	}



}

HelloCtrl.primaryDB = 'influxdb';
HelloCtrl.scrollable = true;
HelloCtrl.templateUrl = 'partials/index.html'; 

