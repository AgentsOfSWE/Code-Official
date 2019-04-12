/*
 * File: TresholdsCtrl.js
 * Creation date: 2019-03-25
 * Author: Diego Mazzalovo
 * Type: ES6
 * Author e-mail: diego.mazzalovo@studenti.unipd.it
 * Version: 0.0.1
 *
 * Changelog:
 * 0.0.1 || Diego Mazzalovo || 2019-03-25 || Creazione Controller
 */

import { coreModule } from 'grafana/app/core/core';

export class TresholdsCtrl {
  constructor() {
    this.panel = [];
    this.actualNode = undefined;
  }

  /**
	 * 	Method used when an user confirm tresholds for a node.
	 * 	It check for the right definition of the tresholds.
	 * 	Then, assign to locale variables tresholds and the link between node and data flush.
	 * 	@param {string} name of the node
	 * 	@return {boolean} true if all tresholds are correctly defined, otherwise false.
	 * */
  confirmTresholdsChanges(node) {
    if (this.panel.actualTable === undefined) {
      this.modalCreator.showMessageModal('E\' necessario selezionare una tabella per poter confermare le soglie.', 'Errore');
      return false;
    }
    if (this.panel.actualFlush === null) {
      this.modalCreator.showMessageModal('E\' necessario selezionare un flusso per poter confermare le soglie.', 'Errore');
      return false;
    }
    if (this.panel.tresholds[node].length === 0) {
      this.modalCreator.showMessageModal('E\' necessario impostare almeno una soglia.', 'Errore');
      return false;
    }

    const maj = [];
    const min = [];
    // check if defining multiple time same treshold
    for (let el = 1; el < this.panel.tresholds[node].length; el++) {
      if (this.panel.tresholds[node][el].value === this.panel.tresholds[node][el - 1].value
				&& this.panel.tresholds[node][el].sign === this.panel.tresholds[node][el - 1].sign) {
        this.panel.canStartComputation = false;
        this.modalCreator.showMessageModal('Non è possibile impostare 2 volte la stessa soglia.', 'Errore');
        return false;
      }
    }

    // split tresholds based on sign
    for (const el in this.panel.tresholds[node]) {
      if (this.panel.tresholds[node][el].sign === '>=') { maj.push(this.panel.tresholds[node][el]); } else { min.push(this.panel.tresholds[node][el]); }
    }

    // check if any tresholds definition conflicts
    for (const mi in min) {
      for (const ma in maj) {
        if (min[mi].value > maj[ma].value) {
          this.panel.canStartComputation = false;
          this.modalCreator.showMessageModal(`Non è possibile dichiarare entrambe le soglie : <${min[mi].value} e >= ${maj[ma].value}.`, 'Errore');
          return false;
        }
      }
    }

    // order tresholds based on value
    this.panel.tresholds[node].sort((a, b) => a.value - b.value);
    // if already linked to a flush add the flush to available flushes again
    if (this.panel.flushesAssociations[node] !== undefined) {
      this.panel.flussi[this.panel.flushesAssociations[node].table].push(this.panel.flushesAssociations[node].flush);
    }
    this.panel.flushesAssociations[node] = {
      table: this.panel.actualTable,
      flush: this.panel.actualFlush,
    };
    this.panel.tresholdLinked[node] = true;

    // computation can start because at least one treshold is defined
    this.panel.canStartComputation = true;

    // remove linked flush to possible flush selection
    this.panel.flussi[this.panel.actualTable].splice(this.panel.flussi[this.panel.actualTable].indexOf(this.panel.actualFlush), 1);
    this.setLinked(node);
    this.modalCreator.showMessageModal('Soglie settate correttamente.', 'Successo');
    return true;
  }


  /**
	 * Adds a node's treshold to lacale variable.
	 * @param{string} node's name.
	 * @param{state} node's state-
	 * */
  addTreshold(node, state) {
    this.panel.tresholds[node].push(
      {
        state,
        sign: '>=',
        value: 0,
        critical: false,
        name: this.panel.tresholds[node].length,
      },
    );
  }

  /**
	 * Deletes a treshold from node
	 * @return{boolean} true if all ok
	 * */
  deleteTreshold(node, name) {
    for (const tresh in this.panel.tresholds[node]) {
      if (this.panel.tresholds[node][tresh].name === name) {
        if (this.panel.tresholds[node].length === 1 && this.panel.flushesAssociations[node] !== undefined) {
          // add flush to available flushes

          this.panel.flussi[this.panel.flushesAssociations[node].table].push(this.panel.flushesAssociations[node].flush);
          // order flushes
          this.panel.flussi[this.panel.flushesAssociations[node].table].sort();
          // delete link
          delete this.panel.flushesAssociations[node];
          this.panel.tresholdLinked[node] = false;
          // reset tresholds
          this.panel.tresholds[node] = [];
        } else { this.panel.tresholds[node].splice(tresh, 1); }
        return true;
      }
    }
    return true;
  }

  setNotLinked(node) {
    this.panel.tresholdLinked[node] = false;
  }

  setLinked(node) {
    this.panel.tresholdLinked[node] = true;
  }

  tablesName() {
    const ris = [];
    for (const el in this.panel.flussi) { ris.push(el); }
    return ris;
  }
}
coreModule.controller('TresholdsCtrl', TresholdsCtrl);
