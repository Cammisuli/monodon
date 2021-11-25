import ts_module from 'typescript/lib/tsserverlibrary';

export class Logger {
  public static create(info: ts_module.server.PluginCreateInfo) {
    return new Logger(info.project.projectService.logger);
  }

  private constructor(private readonly _logger: ts_module.server.Logger) {}

  log(message: string): void {
    this._logger.info(`NX Imports Plugin: ${message}`);
  }
}
