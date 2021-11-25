import ts_module from 'typescript/lib/tsserverlibrary';
import { dirname } from 'path';
import { Logger } from './logger';

const isNxImportPlugin = Symbol('__isNxImportPlugin__');

export class NxImportsPlugin {
  constructor(
    private readonly ts: typeof ts_module,
    private readonly languageServiceHost: ts_module.LanguageServiceHost,
    private readonly logger: Logger,
    private readonly project: ts_module.server.Project,
    private config: Record<string, unknown>
  ) {
    logger.log('config ' + JSON.stringify(config));
  }

  getExternalFiles(project: ts_module.server.Project): string[] {
    const externalFiles =
      (this.config['externalFiles'] as {
        mainFile: string;
        directory: string;
      }[]) || [];

    const projectDirectory = dirname(project.getProjectName());
    this.logger.log(`project directory: ${projectDirectory}`);

    const filteredExternalFiles = externalFiles
      .filter(({ directory }) => {
        return !projectDirectory.startsWith(directory);
      })
      .map(({ mainFile }) => mainFile);
    this.logger.log(`external files: ${JSON.stringify(filteredExternalFiles)}`);

    return filteredExternalFiles;
  }
  /**
   * /user/projects/parent
   *
   * /user/projects/parent/src/index.ts
   * /user/projects/parent/child/src/index.ts
   *
   */
  decorate(languageService: ts.LanguageService) {
    if ((languageService as any)[isNxImportPlugin]) {
      // Already decorated
      return;
    }

    const intercept: Partial<ts.LanguageService> = Object.create(null);

    const oldGetCompletionsAtPosition =
      languageService.getCompletionsAtPosition.bind(languageService);
    intercept.getCompletionsAtPosition = (
      fileName: string,
      position: number,
      options: ts_module.GetCompletionsAtPositionOptions | undefined
    ) => {
      this.logger.log(`getCompletionsAtPosition ${fileName}:${position}`);
      return this.getCompletionsAtPosition(
        oldGetCompletionsAtPosition,
        fileName,
        position,
        options
      );
    };

    return new Proxy(languageService, {
      get: (
        target: any,
        property: keyof ts.LanguageService & typeof isNxImportPlugin
      ) => {
        if (property === isNxImportPlugin) {
          return true;
        }
        return intercept[property] || target[property];
      },
    });
  }

  private getCompletionsAtPosition(
    delegate: ts_module.LanguageService['getCompletionsAtPosition'],
    fileName: string,
    position: number,
    options: ts_module.GetCompletionsAtPositionOptions | undefined
  ): ts_module.WithMetadata<ts_module.CompletionInfo> | undefined {
    return delegate(fileName, position, options);
  }
}
