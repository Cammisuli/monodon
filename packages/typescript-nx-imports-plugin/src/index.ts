import ts from 'typescript/lib/tsserverlibrary';
import { Logger } from './lib/logger';
import { NxImportsPlugin } from './lib/nx-imports-plugin';

const init: ts.server.PluginModuleFactory = ({ typescript }) => {
  let logger: Logger | undefined;
  let nxImportsPlugin: NxImportsPlugin | undefined;

  return {
    create: function (info: ts.server.PluginCreateInfo) {
      logger = Logger.create(info);
      logger.log('create');

      nxImportsPlugin = new NxImportsPlugin(
        typescript,
        info.languageServiceHost,
        logger,
        info.project,
        info.config
      );

      return nxImportsPlugin.decorate(info.languageService);
    },
    onConfigurationChanged: function (config: any) {
      logger?.log('onConfigurationChanged, ' + JSON.stringify(config, null, 2));
    },
    getExternalFiles(project: ts.server.Project) {
      if (!nxImportsPlugin) return [];

      return nxImportsPlugin.getExternalFiles(project);
    },
  };
};

export = init;
