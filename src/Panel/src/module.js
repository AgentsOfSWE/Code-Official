import $ from 'jquery';
import { GBCtrl } from './GBCtrl';
import { TresholdsCtrl } from './TresholdsCtrl';
import { TemporalPoliticCtrl } from './TemporalPoliticCtrl';
import './css/panel.base.css';
import './css/panel.dark.css';

import { loadPluginCss } from 'grafana/app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/G&B/src/css/panel.base.css',
  light: 'plugins/G&B/src/css/panel.dark.css',
});

export {
  TemporalPoliticCtrl,
  TresholdsCtrl as TresholdCtrl,
  GBCtrl as PanelCtrl,
};
