# Agents of S.W.E. 
### Repository ufficiale del gruppo per il progetto di Ingegneria del Software
#### Componenti del Team 
| Membro | Matricola | Email |
|---------|-----------|-------|
Marco Chilese | 1143012 | marco.chilese@studenti.unipd.it
Marco Favaro  | 1123187 | marco.favaro.8@studenti.unipd.it
Diego Mazzalovo | 1142519 | diego.mazzalovo@studenti.unipd.it
Carlotta Segna | 1123208 | carlotta.segna@studenti.unipd.it
Matteo Slanzi | 1100866 | matteo.slanzi@studenti.unipd.it
Bogdan Stanciu | 1120518 | bogdan.stanciu@studenti.unipd.it
Luca Violato | 1127437 | luca.violato@studenti.unipd.it

Email: agentsofswe@gmail.com

#### Guida all'installazione 
- Download ed installazione di Grafana: [Link al sito di Grafana](https://grafana.com/grafana/download/5.4.3); </br>
***Importante**: installare la versione **5.4.3**. Per l'installazione su Mac evitare l'uso di Brew poichè esegue l'update alla versione 6.0.0.*
- Configurazione di Grafana:
  - Inserire come sorgente dati **InfluxDB** con i seguenti parametri:
    - Url: `http://http://142.93.102.115:8086`;
    - User: `greg`;
    - Password: `greg`.
- Stoppare il servizio di Grafana in esecuzione nel PC;
- Scaricare dalla repository la release: [Link al download](https://github.com/AgentsOfSWE/Code-Official/archive/v0.1.zip);
- Copiare la cartella scaricata nella posizione indicata nella documentazione di Grafana: [Link alla documentazione](http://docs.grafana.org/plugins/installation/);
- Raggiungere la directory da terminale, eseguire i seguenti comandi di installazione e build:
  - `npm install && npm run build`.
- Avviare Grafana;
- Creare una dashboard ed aggiungere il plugin appena installato.   
