import ts_module from 'typescript/lib/tsserverlibrary';
import { dirname } from 'path';
import { Logger } from './logger';

const isNxImportPlugin = Symbol('__isNxImportPlugin__');

export class NxImportsPlugin {
  logger: Logger | undefined;
  config: Record<string, unknown> = {};
  projects = new Map<string, ts_module.server.Project>();

  constructor(private readonly typescript: typeof ts_module) {}

  setConfig(config: Record<string, unknown>) {
    this.logger?.log('setting configuration ' + JSON.stringify(config));
    this.config = config;

    this.projects.forEach((project) => {
      this.updateProject(project);
    });
  }

  addProject(project: ts_module.server.Project) {
    this.logger?.log('addProject ' + project.getProjectName());
    if (this.projects.has(project.getProjectName())) {
      this.logger?.log('project already tracked ' + project.getProjectName());
      return;
    }
    this.projects.set(project.getProjectName(), project);
    this.updateProject(project);
  }

  private updateProject(project: ts_module.server.Project) {
    this.logger?.log('updating project');
    const externals = this.getRootFiles(project);
    externals.forEach((external) => {
      project.addMissingFileRoot(
        this.typescript.server.toNormalizedPath(external)
      );
    });
  }

  getRootFiles(project: ts_module.server.Project): string[] {
    this.logger?.log('get root files: ' + JSON.stringify(this.config));
    const externalFiles =
      (this.config['externalFiles'] as {
        mainFile: string;
        directory: string;
      }[]) || [];

    const projectDirectory = dirname(project.getProjectName());
    this.logger?.log(`project directory: ${projectDirectory}`);

    const filteredExternalFiles = externalFiles
      .filter(({ directory }) => {
        return !projectDirectory.startsWith(directory);
      })
      .map(({ mainFile }) => mainFile);
    this.logger?.log(`root files: ${JSON.stringify(filteredExternalFiles)}`);

    return filteredExternalFiles;
  }

  decorate(languageService: ts.LanguageService) {
    this.logger?.log('decorate');
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
      this.logger?.log(`getCompletionsAtPosition ${fileName}:${position}`);
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
