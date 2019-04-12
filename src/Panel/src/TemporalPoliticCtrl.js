/*
 * File: TemporalPoliticCtrl.js
 * Creation date: 2019-03-26
 * Author: Diego Mazzalovo
 * Type: ES6
 * Author e-mail: diego.mazzalovo@studenti.unipd.it
 * Version: 0.0.1
 *
 * Changelog:
 * 0.0.1 || Diego Mazzalovo || 2019-03-26 || Creazione Controller
 */

import { coreModule } from 'grafana/app/core/core';

export default class TemporalPoliticCtrl {
  constructor() {
    this.panel = {};
  }

  setConfirmationToFalse() {
    this.panel.temporalPoliticConfirmed = false;
  }

  /**
   * method used to confirm changes
   * */
  setConfirmationToTrue() {
    if (this.panel.temporalPolitic.seconds < 0) {
      this.modalCreator.showMessageModal('Impossibile impostare secondi < 0.', 'Errore');
    }
    else if (this.panel.temporalPolitic.seconds > 59) {
      this.modalCreator.showMessageModal('Impossibile impostare secondi > 59.', 'Errore');
    }
    else if (this.panel.temporalPolitic.minutes < 0)
    {
      this.modalCreator.showMessageModal('Impossibile impostare minuti < 0.', 'Errore');
    }
    else if (this.panel.temporalPolitic.minutes > 59) {
      this.modalCreator.showMessageModal('Impossibile impostare minuti > 59.', 'Errore');
    }
    else if (this.panel.temporalPolitic.hours < 0) { this.modalCreator.showMessageModal('Impossibile impostare ore < 0.', 'Errore'); } else {
      this.panel.temporalPoliticConfirmed = true;
      this.modalCreator.showMessageModal('Politica temporale impostata correttamente.', 'Successo');
    }
  }
}
coreModule.controller('TemporalPoliticCtrl', TemporalPoliticCtrl);

TemporalPoliticCtrl.scrollable = true;
