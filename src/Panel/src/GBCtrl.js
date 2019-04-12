/*
 * File: hello_ctrl.js
 * Creation date: 2019-02-22
 * Author: Bogdan Stanciu
 * Type: JS6
 * Author e-mail: bogdan.stanciu@studenti.unipd.it
 * Version: 0.0.1
 *
 * Changelog:
 * 0.0.3 || Diego Mazzalovo|| 2019-03-20 || Refactoring codice, collegamento server
 * 0.0.2 || Bogdan Stanciu || 2019-02-23 || Implementazione salvataggio/caricamento rete from LocalStorage
 * 0.0.1 || Bogdan Stanciu || 2019-02-22 || Creazione controller
 */
import { PanelCtrl } from 'grafana/app/plugins/sdk';
import _ from 'lodash';
import Parser from './js/parser';
import GetApiGrafana from './js/GetApiGrafana';
import ModalCreator from './ModalCreator';
import DBProxy from './js/DBProxy';
import ConnectServer from './js/ConnectServer';
import jsbayes from './js/jsbayes/jsbayes';

export class GBCtrl extends PanelCtrl {
  /** @ngInject * */
  constructor($scope, $injector, backendSrv) {
	super($scope, $injector);
	this.backendSrv = backendSrv;

	const panelDefaults = {
	  visualizingMonitoring: false,
	  actuallyVisualizingMonitoring: undefined,
	  selectedDB: null,
	  monitoring: false,
	  loadingNet: false,
	  name: '',
	  nodes: {},
	  states: {},
	  database: undefined,
	  tresholds: {},
	  availableDatabases: {},
	  collegatoAlDB: false,
	  flussi: [],
	  actualFlush: null,
	  actualTable: undefined,
	  flushesAssociations: {},
	  tresholdLinked: {},
	  db: undefined,
	  temporalPolitic: {
		seconds: 0,
		minutes: 0,
		hours: 0,
	  },
	  temporalPoliticConfirmed: false,
	  selectedNetworkToOpen: undefined,
	  availableNetworksToLoad: undefined,
	  monitoringNetworks: undefined,
	  calculatedProbabilities: {},
	};

	this.server = {
	  port: '8600',
	  IP: '142.93.102.115',
	  connected: false,
	};
	this.serverConnection = null;

	this.modalCreator = new ModalCreator(this);
	// needed to send data to server
	this.databaseSelected = undefined;

	_.defaults(this.panel, panelDefaults);

	// connects to grafana
	this.getDatabases().then();
	this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
	this.resetData();
  }

  

	/**
	* onInitEditMode: initializes tabs
	*/
  onInitEditMode() {
	this.addEditorTab('Server Settings', `/public/plugins/${this.pluginId}/partials/ServerTab.html`, 2);
  }

	/**
	* Method used to set all data to start values.
	* @return{boolean} true
	**/
  resetData() {
	this.panel.canStartComputation = false;
	this.panel.flushesAssociations = {};
	this.panel.monitoring = false;
	this.panel.name = '';
	this.panel.nodes = [];
	this.panel.parents = {};
	this.panel.states = {};
	this.panel.probabilities = {};
	this.panel.temporalPolitic = {
	  seconds: 0,
	  minutes: 0,
	  hours: 0,
	};
	this.panel.temporalPoliticConfirmed = false;
	this.panel.collegatoAlDB = false;
	this.panel.databaseSelected = null;
	this.panel.selectedDB = null;
	this.db = undefined;
	return true;
  }

	/**
	* Resets all tresholds
	* Prepare tresholds json to store new tresholds
	**/
  resetTresholds() {
	this.panel.tresholds = {};
	this.panel.tresholdLinked = {};
	for (const n in this.panel.nodes) {
	  this.panel.tresholds[this.panel.nodes[n]] = [];
	  this.panel.tresholdLinked[this.panel.nodes[n]] = false;
	}
  }

  /**
	* Check if user has defined at least 1 treshold
	 * @return{boolean} if positive
	* */
  checkIfAtLeastOneTresholdDefined() {
	for (const el in this.panel.nodes) {
	  if (this.panel.tresholdLinked[this.panel.nodes[el]] === true) { return true; }
	}
	return false;
  }

  /**
	 * Method used to check if the network is in right conditions to start computation.
	 * It checks if user defined at least 1 treshold, user linked a database and confirmed temporal politic.
	 * Builds data to send to server
	 * @return{boolean} true if all went ok
	 * */
  async startComputation() {
	// check if connected to a DB and defined at least one treshold and confirmed temporal politic
	if (this.panel.selectedDB === null || this.panel.collegatoAlDB === false) { this.modalCreator.showMessageModal('Nessun database selezionato.', 'Errore'); } else if (this.checkIfAtLeastOneTresholdDefined() === false) { this.modalCreator.showMessageModal('Nessuna soglia impostata. Per iniziare il monitoraggio è necessario collegare almeno un nodo definendone almeno una soglia.', 'Errore'); } else if (this.panel.temporalPoliticConfirmed === false) { this.modalCreator.showMessageModal('E\' necessario impostare la politica temporale per iniziare il montoarggio.', 'Errore'); } else {
	  // build data to send to server
	  this.panel.monitoring = true;
	  const dataToSend = this.buildDataToSend();
	  // send to server
	  try {
		await this.loadNetworkToServer(dataToSend);
	  } catch (e) {
		this.modalCreator.showMessageModal('Impossibile iniziare il monitoraggio.', 'Errore');
		return false;
	  }
	  this.modalCreator.showMessageModal('Monitoraggio iniziato correttamente.', 'Successo');
	  await this.requestNetworks();
	  return true;
	}
	return true;
  }

  /**
	* Method invoked when the users want to delete a node's link to a flush.
	* @param{string} node's name.
   	*@return{boolean}
	**/
  deleteLinkToFlush(node) {
	if (this.panel.monitoring === true) {
	  this.modalCreator.showMessageModal('Impossibile scollegare nodi durante il monitoraggio.');
	  return false;
	}
	// re-add flush to available and order the array
	this.panel.flussi[this.panel.flushesAssociations[node].table].push(this.panel.flushesAssociations[node].flush);
	this.panel.flussi[this.panel.flushesAssociations[node].table].sort();
	// delete the connection
	delete this.panel.flushesAssociations[node];
	this.panel.tresholdLinked[node] = false;
	this.panel.tresholds[node] = [];
	return true;
  }

  /**
	 * Function needed when loading a new network.
	 * For each  flush actually linked, re-add it to selectable flushes
	 * */
  freeAllFlushes() {
	for (const flush in this.panel.flushesAssociations) {
	  if (!this.panel.flussi[this.panel.flushesAssociations[flush].table].includes(this.panel.flushesAssociations[flush].flush)) {
		this.panel.flussi[this.panel.flushesAssociations[flush].table].push(this.panel.flushesAssociations[flush].flush);
		this.panel.flussi[this.panel.flushesAssociations[flush].table].sort();
	  }
	}
  }

  /** *
	 * Method used to close computation.
	 * @return{boolean} true if computation ends correctly
	 */
  async closeComputation() {
	this.panel.monitoring = false;
	const dataToSend = this.buildDataToSend();
	// send to server
	try {
	  await this.loadNetworkToServer(dataToSend);
	} catch (e) {
	  this.modalCreator.showMessageModal('Errore nell\'interruzione del monitoraggio. Controllare la connessione al server.', 'Errore');
	  return false;
	}
	this.modalCreator.showMessageModal('Monitoraggio interrotto correttamente.', 'Successo');
	await this.requestNetworks();
	return true;
  }

  /**
	 * Method used to get available databases.
	 * After, calls the getSource method which retrieves available databases.
	 * */
  async getDatabases() {
	const gr = new GetApiGrafana(this.backendSrv);
	// request list of databases
	this.panel.availableDatabases = await gr.getData();
	console.log(this.panel.availableDatabases );
  }

  /**
	 * Method used to connect to database.
	 * Calls methods getConnectionToDB and getFlushes to retrieve available flushes.
   * @return{boolean}
	 * */
  async connectToDB() {
	if (this.panel.monitoring === true) {
	  this.modalCreator.showMessageModal('Impossibile cambiare database mentre è sotto monitoraggio.', 'Errore');
	  return false;
	}
	// check if selected a db and it's a influxdb DB
	if (this.panel.selectedDB === null) {
	  this.modalCreator.showMessageModal('Nessun database selezionato.', 'Errore');
	  return false;
	}
	if (this.panel.availableDatabases[this.panel.selectedDB].type !== 'influxdb') {
	  this.modalCreator.showMessageModal('Non è possibile utilizzare database non influx.', 'Errore');
	  return false;
	}
	// connects to db
	this.getConnectionToDb();
	this.resetTresholds();
	// get all available flushes
	if (await this.getFlushes()) {
	  this.modalCreator.showMessageModal('Database collegato correttamente.', 'Successo');
	} else {
	  this.modalCreator.showMessageModal('Impossibile connettersi al database.', 'Errore');
	  return false;
	}
	return true;
  }

  /**
	 * Instantiate proxy to db
	 * @return{Boolean} true
	 * */
  getConnectionToDb() {
	const db = this.panel.availableDatabases[this.panel.selectedDB];
	this.panel.database = db;
	const s = db.url.split(':');
	s[1] = s[1].substring(2, s[1].length);
	this.db = new GetApiGrafana(this.backendSrv, db);

	return true;
  }

  /**
	 * Method used to retrieve available databases' data flushes.
	 * stores in locale variable panel.flussi databases flushes.
	 * @return{boolean} true if all went ok
	 * */
  async getFlushes() {
	let ds;
	try {
	  // call database to obtain all available flushes and tables
	  ds = await this.db.getDatasources();
	  this.panel.flussi = ds;
	  // if not loading a network resets the tresholds because only one database is usable by a network
	  if (this.panel.collegatoAlDB === true && !this.panel.loadingNet) { this.resetTresholds(); }

	  this.databaseSelected = this.panel.selectedDB;
	  this.panel.collegatoAlDB = true;
	  return true;
	} catch (e) {
	  this.panel.collegatoAlDB = false;
	  return false;
	}
  }

  /**
	 * Method used to get panel's path
	 * @return{string} the path
	 * */
  get panelPath() {
	if (this._panelPath === undefined) {
	  this._panelPath = `/public/plugins/${this.pluginId}/`;
	}
	return this._panelPath;
  }

  /**
	 * Spawns modal to set tresholds for a node.
	 * @param{string} name of the node to show tresholds
	 * */
  showTresholdModal(node) {
	this.modalCreator.showTresholdModal(node);
  }

  /**
	 * Spawns modal to set temporal politic
	 * */
  selectTemporalPolitic() {
	this.modalCreator.selectTemporalPolitic();
  }

  /**
	 * Method used to change visualization in the panel. Switches from settings to visualize monitoring
	 * */
  visualizeMonitoring() {
	this.panel.visualizingMonitoring = true;
  }


  /**
	 * Method used to change visualization in the panel. Switches from visualize monitoring to settings
	 * */
  visualizeSettings() {
	this.panel.visualizingMonitoring = false;
  }

	/**
	* Test if server is alive using a ConnectServer function
	 * @return{boolean}
	*/
  async tryConnectServer() {
	try {
	  // connects to server
	  this.testServer = new ConnectServer(this.server.IP, this.server.port);
	  this.server.connected = await this.testServer.alive() !== undefined;
	  // check if correctly connected
	  if (this.server.connected) {
		// ask server list of all stored networks
		await this.requestNetworks();
		this.modalCreator.showMessageModal('Connesso al server.', 'Successo');
		return true;
	  }
	} catch (e) {
	  this.modalCreator.showMessageModal('Il server non è online su questa porta. Prova a cambiare porta e/o IP.', 'Errore');
	  this.server.connected = false;
	  return false;
	}
	return true;
  }

  /**
	 * Checks in all networks which is monitoring data.
	 * @return{array} all monitoring networks.
	 * */
  splitMonitoringNetworks() {
	const res = [];
	for (const net in this.panel.availableNetworksToLoad) {
	  if (this.panel.availableNetworksToLoad[net].monitoring) { res.push(this.panel.availableNetworksToLoad[net].name); }
	}
	return res;
  }

	 /**
   * Function use a method of ConnectServer class that return all net from server
		* @return{booelan} true
   */
  async requestNetworks() {
	try {
	  // ask server all networks
		this.panel.availableNetworksToLoad = await this.testServer.networks();
	  // check which network is monitoring
	  this.panel.monitoringNetworks = this.splitMonitoringNetworks();
	  return true;
	} catch (e) {
	  this.modalCreator.showMessageModal('Impossibile collegarsi al server per aggiornare la lista delle reti salvate.', 'Error');
	  return false;
	}
  }

  /**
   * Function delete a net into server by name
   * @param {net} net to delete
   * @var : if x is true, the network has been successfully deleted else false
   */
  async requestNetworkDelete(net) {
	if (net === null) {
	  this.modalCreator.showMessageModal('Selezionare una rete da eliminare.', 'Errore');
	  return false;
	}
	if (this.panel.monitoringNetworks.includes(net)) {
	  this.modalCreator.showMessageModal('Impossibile eliminare una rete durante il monitoraggio.', 'Errore');
	  return false;
	}
	try {
	  try {
		await this.testServer.deletenetwork(net);
	  } catch (e) {
		if (e.status === 200) { await this.requestNetworks(); this.modalCreator.showMessageModal('Rete eliminata', 'Successo'); return true; }
		throw new Error('Errore');
	  }
	} catch (e) {
	  this.modalCreator.showMessageModal('Impossibile eliminare la rete. Controllare la connessione al server.', 'Errore');
	  return false;
	}
	return false;
  }


  /**
   * @param{TemporalPolitic}
   * @return{int} temporal politic in seconds
   * */
  calculateSeconds(temp) {
	return temp.seconds + temp.minutes * 60 + temp.hours * 3600;
  }

  /**
   * Method that updates local calculated probabilities
   * @param{string} network to update probabilties
   * @return{boolean}
   * */
  async updateProbs(net) {
	try {
	  this.panel.calculatedProbabilities = await this.testServer.getnetworkprob('Alarm');
	} catch (e) { return false; }
	return true;
  }

  /**
   * Method that sets up to change monitored probabilities
   * @param{string} name of the network
   * @return{boolean}
   * */
  async changeNetworkToVisualizeMonitoring(net) {
	try {
	  clearInterval(this.interval);
	  const n = await this.testServer.getnetwork('Alarm');
	  this.interval = setInterval(this.updateProbs.bind(this), this.calculateSeconds(n.temporalPolitic));
	  this.modalCreator.showMessageModal('Aggiornata visualizzazione.', 'Successo');
	} catch (e) {
	  this.modalCreator.showMessageModal('Impossibile ottenere le probabilità dal server.', 'Errore');
	  return false;
	}
	return true;
  }


  /**
	 * Function use a method of ConnectServer class that return the network by name
	 * @param{net} name of net selected from user
   * @return{boolean} true if ok
	 */
  async requestNetworkToServer(net) {
	try {
	  // if has already a network loaded, store it to server
	  if (this.panel.name !== '' && this.panel.collegatoAlDB === true) {
		const dataToSend = this.buildDataToSend();
		dataToSend.monitoring = this.panel.monitoring === true;
		// save changes
		try {
		  await this.loadNetworkToServer(dataToSend);
		} catch (e) {
		  throw new Error('Impossibile salvare i cambiamenti.');
		}
	  }
	  // ask network to the server
	  const n = await this.testServer.getnetwork(net);
	  // load data from network
	  this.resetData();
	  this.resetTresholds();
	  await this.loadNetworkFromSaved(n);
	  return true;
	} catch (e) {
	  this.modalCreator.showMessageModal('Impossibile caricare la rete selezionata.', 'Error');
	  return false;
	}
  }

  /**
	 * Method called when need to send data to server
	 * @return{array} packet containing all data needed to server
	 * */
  buildDataToSend() {
	const dataToSend = {};
	dataToSend.canStartComputation = this.panel.canStartComputation;
	dataToSend.collegatoAlDB = this.panel.collegatoAlDB;
	dataToSend.database = this.panel.database;
	dataToSend.databaseSelected = this.panel.databaseSelected;
	dataToSend.flushesAssociations = this.panel.flushesAssociations;
	dataToSend.monitoring = this.panel.monitoring;
	dataToSend.name = this.panel.name;
	dataToSend.nodes = this.panel.nodes;
	dataToSend.parents = this.panel.parents;
	dataToSend.states = this.panel.states;
	dataToSend.probabilities = this.panel.probabilities;
	dataToSend.temporalPolitic = this.panel.temporalPolitic;
	dataToSend.temporalPoliticConfirmed = this.panel.temporalPoliticConfirmed;
	dataToSend.tresholdLinked = this.panel.tresholdLinked;
	dataToSend.tresholds = this.panel.tresholds;
	dataToSend.selectedDB = this.panel.selectedDB;
	return dataToSend;
  }


  /**
	 * method called when it's needed to load a network from a JSON file.
	 * Stores data in local variables
	 * @param {string} .JSON string file
   * @return {boolean} true if ok
	 * */
  async loadNetwork(data) {
	// check if already has a network loaded
	// if true then save actual network to server
	// if not connected to db takes no sense to save data
	try {
	  if (this.panel.name !== '' && this.panel.collegatoAlDB === true) {
		const dataToSend = this.buildDataToSend();
		dataToSend.monitoring = this.panel.monitoring === true;
		try {
		  await this.loadNetworkToServer(dataToSend);
		} catch (e) {
		  this.modalCreator.showMessageModal('Impossibile salvare i cambiamenti.', 'Errore');
		  return false;
		}
	  }
	  this.resetData();
	  if (this.panel.selectedDB !== null) {
		// reconnect to db
		this.getConnectionToDb();
		await this.getFlushes();
	  }
	  // call parser to validate the network
	  const parser = new Parser(data);
	  parser.validateNet();
	  // assign parameters got from network
	  this.panel.name = data.name;
	  this.panel.nodes = data.nodes;
	  this.panel.states = data.states;
	  this.panel.parents = data.parents;
	  this.panel.probabilities = data.probabilities;

	  this.modalCreator.showMessageModal('Rete caricata con successo.', 'Successo');
	  return true;
	  // delete all tresholds and prepare to store new ones
	  this.resetTresholds();
	} catch (e) {
	  this.modalCreator.showMessageModal(e, 'Errore');
	  return false;
	}
  }

  /**
	 * Method used to load information from a network saved
	 * Stores in local variables all data.
	 * @param{json} all data from server
	 * */
  async loadNetworkFromSaved(net) {
	this.panel.loadingNet = true;
	this.panel.name = net.name;
	this.panel.nodes = net.nodes;
	this.panel.parents = net.parents;
	this.panel.states = net.states;
	this.panel.probabilities = net.probabilities;
	this.panel.temporalPolitic = net.temporalPolitic;
	this.panel.temporalPoliticConfirmed = net.temporalPoliticConfirmed;

	this.panel.canStartComputation = net.canStartComputation;
	this.panel.collegatoAlDB = net.collegatoAlDB;
	this.panel.selectedDB = net.selectedDB;
	this.panel.database = net.database;
	this.panel.databaseSelected = net.databaseSelected;

	// connect to right database
	this.getConnectionToDb();
	await this.getFlushes();

	this.panel.flushesAssociations = net.flushesAssociations;
	this.panel.monitoring = net.monitoring;
	this.panel.tresholdLinked = net.tresholdLinked;
	this.panel.tresholds = net.tresholds;
	// if no tresholds were defined, need to reset the data
	if (this.panel.tresholds === {}) this.resetTresholds();
	// removing used flushes to from all
	for (const el in this.panel.flushesAssociations) {
	  this.panel.flussi[this.panel.flushesAssociations[el].table].splice(
		this.panel.flussi[this.panel.flushesAssociations[el].table]
		  .indexOf(this.panel.flushesAssociations[el].flush), 1,
	  );
	}

	this.panel.loadingNet = false;
	this.modalCreator.showMessageModal('Rete caricata correttamente.', 'Successo');
  }

  /**
	 * Method used to send a network to server
	 * @param{string} name of the network.
	 * */
  async loadNetworkToServer(net) {
	// send network to server to store it
	try {
	  await this.testServer.uploadnetwork(JSON.stringify(net));
	} catch (e) {
	  if (e.status === 200) {
		// refresh list of networks
		await this.requestNetworks();
		this.modalCreator.showMessageModal('Rete caricata con successo.', 'Successo');
	  } else { throw new Error('Rete non caricata.'); }
	}
  }
}

GBCtrl.scrollable = true;
GBCtrl.templateUrl = 'partials/index.html';
