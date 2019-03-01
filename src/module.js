import { HelloCtrl } from './hello_ctrl';
import './css/panel.base.css';
import './css/panel.dark.css';

import { loadPluginCss } from 'grafana/app/plugins/sdk';
import { QueryCtrl  } from 'grafana/app/plugins/sdk';

loadPluginCss({
	dark: 'plugins/hello-webpack-plugin/css/panel.base.css', 
	light: 'plugins/hello-webpack-plugin/css/panel.dark.css'
});


export {
  HelloCtrl as PanelCtrl, QueryCtrl
};
