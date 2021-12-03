import ts from 'typescript/lib/tsserverlibrary';
import { Logger } from './lib/logger';
import { NxImportsPlugin } from './lib/nx-imports-plugin';

const init: ts.server.PluginModuleFactory = ({ typescript }) => {
  let logger: Logger | undefined;
  const nxImportsPlugin = new NxImportsPlugin(typescript);

  return {
    create(info: ts.server.PluginCreateInfo) {
      logger = Logger.create(info);
      logger.log('create');
      nxImportsPlugin.logger = logger;

      if (Object.keys(info.config).length > 0) {
        nxImportsPlugin.setConfig(info.config);
      }
      nxImportsPlugin.addProject(info.project);

      return nxImportsPlugin.decorate(info.languageService);
    },
    onConfigurationChanged(config: {
      externalFiles?: { mainFile: string; directory: string }[];
      disable?: boolean;
    }) {
      logger?.log('onConfigurationChanged called, ' + JSON.stringify(config));
      nxImportsPlugin.setConfig(config);
    },
  };
};

export = init;
