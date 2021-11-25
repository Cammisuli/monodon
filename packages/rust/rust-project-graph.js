// @ts-check
const { ProjectGraphBuilder } = require('@nrwl/devkit');
const execa = require('execa');
const { join } = require('path');

/**
 * Nx Project Graph plugin for go
 *
 * @param {import('@nrwl/devkit').ProjectGraph} graph
 * @param {import('@nrwl/devkit').ProjectGraphProcessorContext} context
 * @returns {import('@nrwl/devkit').ProjectGraph}
 */
exports.processProjectGraph = (graph, context) => {
  const builder = new ProjectGraphBuilder(graph);

  console.log(graph);

  // builder.addExplicitDependency()

  return builder.getUpdatedProjectGraph();
};
