function init(modules: {
  typescript: typeof import('typescript/lib/tsserverlibrary');
}) {
  const ts = modules.typescript;

  function create(info: ts.server.PluginCreateInfo) {
    // info.project.addMissingFileRoot(ts.server.toNormalizedPath('../'));
    // info.project.addMissingFileRoot;
    // Set up decorator object
    const proxy: ts.LanguageService = Object.create(null);
    for (const k of Object.keys(info.languageService) as Array<
      keyof ts.LanguageService
    >) {
      const x = (proxy[k] = (...args: Array<unknown>) =>
        x.apply(info.languageService, args));
    }

    // TODO: get list of imports from proxy.getProgram()
    proxy.getCompletionsAtPosition = (fileName, position, options) => {
      const prior = info.languageService.getCompletionsAtPosition(
        fileName,
        position,
        options
      );
      prior.entries = prior.entries.filter((e) => [].indexOf(e.name) < 0);
      return prior;
    };

    return proxy;
  }
  return { create } as ts.server.PluginModule;
}

export = init;
