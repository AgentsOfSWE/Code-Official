/**
 * File: parser
 * Type: .js
 * Creation Date: 2019-02-14
 *  Author: Diego Mazzalovo
 *  Author e-mail: diego.mazzalovo@studenti.unipd.it
 *  Verion: 0.0.1
 *
 *  Changelog:
 *  0.0.1 || Diego Mazzalovo || 2019-02-14 || scrittura script
 *  0.0.1 || Diego Mazzalovo || 2019-02-16 || completamento
 */


export default class Parser {
  constructor(fileAsString) {
    this.file = fileAsString;
    this.nodeNames = [];
    this.nodesStates = [];
    this.nodesParents = [];
    this.nodesProbabilities = [];
   // try {
      //this.info = JSON.parse(this.file);
    this.info = fileAsString;
      this.getInfo();/*
    } catch (e) {
      console.log(`Presa eccezione --> ${e}`);
    }*/
  }

  /**
  * @param {array} values to evaluate
  * @return {boolean} true if there is at least a repeated value in the array
  */
  checkDuplicates(values) {
    for (let i = 0; i < values.length; i++) for (let j = 0; j < values.length; j++) if (i !== j && values[i] === values[j]) return true;
    return false;
  }

  /**
   * check for the correct structure of the .JSON file
   * @return {boolean} true if completed correctly
   * @throws {Error} if .JSON file contains a number of fields different from 4
   * @throws {Error} if field nodes isn't detected
   * @throws {Error} if field states isn't detected
   * @throws {Error} if field parents isn't detected
   * @throws {Error} if field probabilities isn't detected
   */
  checkStructure() {
    const keys = Object.keys(this.info);
    if (keys.length !== 4) throw Error('Incorrect number of fields');
    if (keys[0] !== 'nodes') throw Error('No nodes definition detected');
    if (keys[1] !== 'states') throw Error('No nodes\' states definition detected');
    if (keys[2] !== 'parents') throw Error('No nodes\' parents definition detected');
    if (keys[3] !== 'probabilities') throw Error('No nodes\' probabilities definition detected');
    this.nodeNames = this.info.nodes;
    return true;
  }

  /**
   * Store in local array this.nodesStates the states of each node.
   * They are stored in this.nodesStates array in position equal to the position
   * of the node in nodeNames array.
   * For example if the node 'Node1' is in position 0 in nodeNames array, its states will be stored
   * in this.nodesStates array in position 0
   * @return {boolean} true if completed correctly
   * @throws {Error} if field states has a number of elements different from nodes quantity
   * @throws {Error} if the nodes aren't in correct order as defined in .JSON file
   * @throws {Error} if finds less than 2 states
   * @throws {Error} if finds multiple times same state
   */
  checkStates() {
    const nodesStates = this.info.states;
    if (Object.keys(nodesStates).length !== this.nodeNames.length) throw Error('Incorrect number of lines in states\' definition');
    let i = 0;
    for (const state in nodesStates) {
      const d = nodesStates[state];
      if (state !== this.nodeNames[i]) throw Error(`Incorrect node's name in states' definition number ${i}, expected ${this.nodeNames[i]}, given ${state}`);
      if (d.length < 2) throw Error(`Error in nodes ${state} states definition, required at least 2`);
      if (this.checkDuplicates(d)) throw Error(`Error in node's ${state} states, trying to define multiple times same state.`);
      this.nodesStates.push(d);
      i++;
    }
    return true;
  }

  /**
   * Store in local array this.nodesParents the parents of each node.
   * They are stored in this.nodesParents array in position equal to the position
   * of the node in nodeNames array.
   * For example if the node 'Node1' is in position 0 in nodeNames array, its parents will be stored
   * in this.nodesParents array in position 0
   * @return {boolean} true if completed correctly
   * @throws {Error} if field parents has a number of elements different from nodes quantity
   * @throws {Error} if the nodes aren't in correct order as defined in .JSON file
   * @throws {Error} if a parent doesn't exist in this.nodeNames array
   * @throws {Error} if a node is defined as parent of itself
   * @throws {Error} if finds multiple times same parent
   */
  checkParents() {
    const nodesParents = this.info.parents;
    if (Object.keys(nodesParents).length !== this.nodeNames.length) throw Error('Incorrect number of lines in parents\' definition');
    let i = 0;
    for (const node in nodesParents) {
      if (node !== this.nodeNames[i]) throw Error(`Incorrect node's name in parents' definition number ${i}, expected ${this.nodeNames[i]}, given ${node}`);
      const parents = nodesParents[node];
      for (const parent in parents) {
        if (!this.nodeNames.includes(parents[parent])) throw Error(`Error node ${parents[parent]} doesn't exist in ${node} parents' definition`);
        if (parents[parent] === node) throw Error(`Error node ${node} declared as parent of itself`);
      }
      if (this.checkDuplicates(parents)) throw Error(`Error in node's ${node} parents, trying to define multiple times same parent.`);
      this.nodesParents.push(parents);
      i++;
    }
    return true;
  }

  /**
   * Store in local array this.nodesProbabilities the probabilities of each node.
   * They are stored in this.nodesProbabilities array in position equal to the position
   * of the node in nodeNames array.
   * For example if the node 'Node1' is in position 0 in nodeNames array, its probabilities
   * will be stored in this.nodesProbabilities array in position 0
   * @return {boolean} true if completed correctly
   * @throws {Error} if field probabilities  has a number of elements different from nodes quantity
   * @throws {Error} if the nodes aren't in correct order as defined in .JSON file
   * @throws {Error} if a node hasn't the correct number of probabilities defined
   * @throws {Error} if a probability isn't defined correctly(0<=p<=1 and is a number)
   * @throws {Error} if a set's sum of conditional probabilities isn't 1
   */
  checkProbabilities() {
    const nodesProbs = this.info.probabilities;
    // check if defined the correct number of field in probabilities field
    if (Object.keys(nodesProbs).length !== this.nodeNames.length) throw Error('Incorrect number of lines in probabilities\' definition');
    let i = 0;
    for (const node in nodesProbs) {
      if (node !== this.nodeNames[i]) throw Error(`Incorrect node's name in probabilities' definition number ${i}, expected ${this.nodeNames[i]}, given ${node}`);
      i++;
    }
    // check if given the correct number of probabilities in each node
    for (const node in this.nodeNames) {
      let partial = 1;
      for (const parent in this.nodesParents[node]) partial *= this.nodesStates[this.nodeNames.indexOf(this.nodesParents[node][parent])].length;
      const prob = nodesProbs[this.nodeNames[node]];
      if (prob.length !== (partial * this.nodesStates[node].length)) throw Error(`Incorrect number of probabilities in node's ${this.nodeNames[node]} probabilities definition, expected ${partial * this.nodesStates[node].length} given ${prob.length}`);
    }
    // insert the probabilities
    for (const node in nodesProbs) {
      // node's row probabilities
      const probabilities = nodesProbs[node];
      // push new array for all rows
      this.nodesProbabilities.push([]);
      // count number of element per each sub array
      let numberOfparents = 1;
      const actuaNodelIndex = this.nodeNames.indexOf(node);
      for (const parent in this.nodesParents[actuaNodelIndex]) numberOfparents *= this.nodesStates[this.nodeNames.indexOf(this.nodesParents[actuaNodelIndex][parent])].length;
      // construct each sub array
      for (let index = 0; index < numberOfparents; index++) {
        // push sub array
        this.nodesProbabilities[this.nodeNames.indexOf(node)].push([]);
        for (let parent = 0; parent < this.nodesStates[this.nodeNames.indexOf(node)].length; parent++) {
          // take actual probability and check it
          const p = probabilities[index * this.nodesStates[actuaNodelIndex].length + parent];
          if (p < 0 || p > 1 || isNaN(p)) throw Error(`Error probability ${p} not valid in node's ${node} probabilities definition`);
          // push probability in sub array
          this.nodesProbabilities[this.nodeNames.indexOf(node)][index].push(p);
        }
      }
    }
    // check if given the correct number of probabilities for each node and for the sum of
    // conditional probabilities set to be 1
    for (const node in this.nodeNames) {
      let expected = 1;
      const probs = this.nodesProbabilities[node];
      for (const parent in this.nodesParents[node]) expected *= this.nodesStates[this.nodeNames.indexOf(this.nodesParents[node][parent])].length;
      // passing for number of parents' states
      for (let i = 0; i < expected; i++) {
        let sum = 0;
        for (const state in this.nodesStates[node]) sum += this.nodesProbabilities[node][i][state];
        if (sum !== 1.0) throw Error(`Invalid probabilities' sum in node ${this.nodeNames[node]}, in set number ${i}, expected 1 found ${sum}`);
      }
    }
    return true;
  }

  /**
   * Starts the computation
   * @return {booelan} true if all went ok
   * */
  getInfo() {
    try {
      this.checkStructure();
      this.checkStates();
      this.checkParents();
      this.checkProbabilities();
    } catch (e) {
      console.log(`Presa eccezione --> ${e}`);
    }
    return true;
  }
}

module.exports = Parser;
