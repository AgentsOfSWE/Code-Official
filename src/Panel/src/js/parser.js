/*
 * File: ParserMiddle.js
 * Creation date: 2019-03-22
 * Author: bogdan
 * Type: ECMAScript 6
 * Author e-mail: bogdan.stanciu@studenti.unipd.it
 * Version: 0.0.1
 * Changelog:
 * 0.0.2 || Diego Mazzalovo || 2019-03-26 || Revisione file
 * 0.0.1 || Bogdan Stanciu  || 2019-03-22 || Sviluppo file
 */

class Parser {
  constructor(data) {
    // json
    this.net = data;
    this.fieldsNeeded = ['name', 'nodes', 'states', 'parents', 'probabilities'];
  }

  /**
     * Check if the network has the data correctly formatted as needed.
     * @return {booelan} true if all went ok.
     */
  validateNet() {
    this.checkMinimumFields();
    this.checkStates();
    this.checkParents();
    this.checkProbabilities();
    return true;
  }

  /**
     * Check if the network has the 4 fields needed.
     * @return {boolean} true if all went ok.
     * @throws {Error} if missing named fileds.
     */
  checkMinimumFields() {
    // If there are not exactly 5 fields return false.
    if (Object.keys(this.net).length != 5) { return false; }

    // Check each field to be exactly named.
    for (const val in this.fieldsNeeded) {
      if (this.net[this.fieldsNeeded[val]] === undefined) { throw new Error(`[Error_code] - Incorrect ${this.fieldsNeeded[val]} definition`); }
    }
    return true;
  }


  /**
     * Check if the dict have the exact number of lines.
     * @return {boolean} true if all went ok.
     */
  checkNamedNodes(data, field) {
    if (Object.keys(data).length !== this.net.nodes.length) { throw new Error(`[Error_code] - Incorrect number of lines in ${field} definition`); }
    for (const key in this.net.nodes) {
      if (data[this.net.nodes[key]] === undefined) { throw new Error(`[Error_code] - Missing node ${this.net.nodes[key]} in ${field}' definition.`); }
    }
    return true;
  }

  /**
     * Check if an array has duplicated values.
     * @return {boolean} true if all went ok.
     */
  checkDuplicates(values) {
    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < values.length; j++) {
        if (i !== j && values[i] === values[j]) { return true; }
      }
    }

    return false;
  }

  /**
     * Check if user defined correctly nodes states.
     * @return {boolean} true if completed correctly
     * @throws {Error} if field states has a number of elements different from nodes quantity
     * @throws {Error} if finds less than 2 states
     * @throws {Error} if finds multiple times same state
     * @throws {Error} if is missing a node in states definition
     */
  checkStates() {
    this.checkNamedNodes(this.net.states, 'states');

    for (const key in this.net.nodes) {
      if (this.net.states[this.net.nodes[key]].length < 2) { throw new Error(`[Error_code] - Error in nodes ${this.net.nodes[key]} states definition, required at least 2.`); }
      if (this.checkDuplicates(this.net.states[this.net.nodes[key]])) { throw new Error(`[Error_code] - Error in node's ${this.net.nodes[key]} states, trying to define multiple times same state.`); }
    }
    return true;
  }

  /**
     * @return {boolean} true if completed correctly
     * @throws {Error} if field parents has a number of elements different from nodes quantity
     * @throws {Error} if missing some nodes.
     * @throws {Error} if a parent doesn't exist in this.nodeNames array
     * @throws {Error} if a node is defined as parent of itself
     * @throws {Error} if finds multiple times same parent
     */
  checkParents() {
    this.checkNamedNodes(this.net.parents, 'parents');
    for (const node in this.net.parents) {
      if (this.checkDuplicates(this.net.parents[node])) { throw new Error(`[Error_code] - Trying to define multiple times same parent in ${node}`); }
      for (const parent in this.net.parents[node]) {
        // Check if all nodes in parent exits in nodes.
        if (!this.net.nodes.includes(this.net.parents[node][parent])) { throw new Error(`[Error_code] - Parent: ${this.net.parents[node][parent]}  does not exits as node in ${node}.`); }
        // Check if a node is parent of itself.
        if (this.net.parents[node][parent] === node) { throw new Error(`[Error_code] - Try to define ${this.net.parents[node][parent]} as parent of itself.`); }
      }
    }
    return true;
  }

  /**
     * Count the number of probability multiply the states of parents for each parent.
     * @param{string} name of the node
     * @return {int} return the number of probabilities
     */
  countNumberOfValue(node) {
    let ans = 1;
    for (const key in this.net.parents[node]) { ans *= this.net.states[this.net.parents[node][key]].length; }
    return ans;
  }

  /**
     * Check correct structure
     * @return {boolean} true if completed correctly
     * @throws {Error} if field probabilities has a number of elements different from nodes quantity
     * @throws {Error} if a node hasn't the correct number of probabilities defined
     * @throws {Error} if a probability isn't defined correctly(0<=p<=1 and is a number)
     * @throws {Error} if a set's sum of conditional probabilities isn't 1
     */
  checkProbabilities() {
    // Check if there are the exact number of rows and each row's name exits in nodes.
    this.checkNamedNodes(this.net.probabilities, 'probabilities');

    for (const probability in this.net.probabilities) {
      // Check the correct number of state for each probability.
      const numberOfStates = this.countNumberOfValue(probability);

      if (this.net.probabilities[probability].length != numberOfStates) {
        throw new Error(`[Error_code] - Try to define incorrect number of subsets in ${probability} probabilities definition, 
                expected ${numberOfStates}, given ${this.net.probabilities[probability].length}`);
      }
      const prob = this.net.probabilities[probability];
      let sum = 0;
      for (const subprobability in prob) {
        sum = 0;
        // check if there are invalid probabilities
        for (const p in prob[subprobability]) {
          if (prob[subprobability][p] < 0 || prob[subprobability][p] > 1) { throw new Error(`[Error_code] - Invalid probability in ${prob[subprobability]}: ${prob[subprobability][p]}`); }

          sum += parseFloat(prob[subprobability][p]);
        }
        // Chekc if the sum of probabilities is 1
        /* if(sum != 1.0)
                    throw new Error(`[Error_code] - Invalid sum of conditional probability in ${prob[subprobability]}`); */
      }
    }
    return true;
  }
}
module.exports = Parser;
