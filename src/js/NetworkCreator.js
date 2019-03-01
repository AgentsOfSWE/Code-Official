/**
 * File: NetworkCreator
 * Type: .js
 * Creation Date: 2019-02-14
 *  Author: Diego Mazzalovo
 *  Author e-mail: diego.mazzalovo@studenti.unipd.it
 *  Verion: 0.0.1
 *
 *  Changelog:
 *  0.0.1 || Diego Mazzalovo || 2019-02-14 || scrittura script
 */


import jsbayes from './jsbayes/jsbayes.js';
import Parser from './parser.js';

export class NetworkCreator {
  constructor(inputAsFile) {
    try {
      this.parser = new Parser(inputAsFile);
      this.nodes = this.parser.nodeNames;
      this.states = this.parser.nodesStates;
      this.parents = this.parser.nodesParents;
      this.probabilities = this.parser.nodesProbabilities;
      this.graph = jsbayes.newGraph();
      this.initialized = false;
      this.initialize();
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Method called to set a node on a specific value
   * calls method graph.observe(node, state)
   * @return {boolean} true if calls the method
   * @throws {Error} if network hasn't been initialized
   * */
  observe(node, state) {
    if (!this.initialized) throw Error('Network not initialized');
    this.graph.observe(node, state);
    return true;
  }


  unobserve(node){
    this.graph.unobserve(node);
  }


  /**
   * method used to start the computation based on observed nodes
   * @return {sample} computation's sample
   * */
  sample(number) {
    if (!this.initialized) throw Error('Network not initialized');
    return this.graph.sample(number);
  }

  /**
   * Method used to initialize the network base on the inputs
   * @return {boolean} true if method works, false if already called
   * */
  initialize() {
    if (this.initialized) return false;
    for (const node in this.nodes) this.graph.addNode(this.nodes[node], this.states[node]);
    for (const node in this.nodes) for (const parent in this.parents[node]) this.graph.node(this.nodes[node]).addParent(this.graph.node(this.parents[node][parent]));
    for (const probs in this.probabilities) if (this.probabilities[probs].length === 1) this.graph.node(this.nodes[probs]).setCpt(this.probabilities[probs][0]); else this.graph.node(this.nodes[probs]).setCpt(this.probabilities[probs]);
    this.initialized = true;
    return true;
  }
}
/*
const file = '{\n'
  + '"nodes": ["Viaggio in Asia", "Tubercolosi", "Fuma", "Cancro", "Bronchite", "TBC o Cancro", "Dispnea", "Risultati sui raggi X"],\n'
  + '"states": {\n'
  + '"Viaggio in Asia": ["true", "false"],\n'
  + '"Tubercolosi": ["true", "false"],\n'
  + '"Fuma": ["true", "false"],\n'
  + '"Cancro": ["true", "false"],\n'
  + '"Bronchite": ["true", "false"],\n'
  + '"TBC o Cancro": ["true", "false"],\n'
  + '"Dispnea": ["true", "false"],\n'
  + '"Risultati sui raggi X": ["true", "false"]\n'
  + '},\n'
  + '"parents": {\n'
  + '"Viaggio in Asia": [],\n'
  + '"Tubercolosi": ["Viaggio in Asia"],\n'
  + '"Fuma": [],\n'
  + '"Cancro": ["Fuma"],\n'
  + '"Bronchite": ["Fuma"],\n'
  + '"TBC o Cancro": ["Tubercolosi", "Cancro"],\n'
  + '"Dispnea": ["TBC o Cancro", "Bronchite"],\n'
  + '"Risultati sui raggi X": ["TBC o Cancro"]\n'
  + '},\n'
  + '"probabilities": {\n'
  + '"Viaggio in Asia": [0.01, 0.99],\n'
  + '"Tubercolosi": [0.05, 0.95, 0.01, 0.99],\n'
  + '"Fuma": [0.5, 0.5],\n'
  + '"Cancro": [0.1, 0.9, 0.01, 0.99],\n'
  + '"Bronchite": [0.6, 0.4, 0.3, 0.7],\n'
  + '"TBC o Cancro": [1.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0],\n'
  + '"Dispnea": [0.9, 0.1, 0.8, 0.2, 0.7, 0.3, 0.1, 0.9],\n'
  + '"Risultati sui raggi X": [0.98, 0.02, 0.05, 0.95]\n'
  + '}\n'
  + '}';

try {
  const net = new NetworkCreator(file);
  net.observe('Fuma', 'true');
  net.sample(10000);
  // for (const node in net.graph.nodes) console.log(net.graph.nodes[node].probs());
} catch (e) {
  console.log(e);
}*/