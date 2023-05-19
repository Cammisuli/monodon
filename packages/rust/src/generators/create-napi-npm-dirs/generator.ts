import {
  ProjectConfiguration,
  Tree,
  formatFiles,
  getPackageManagerCommand,
  getProjects,
  joinPathFragments,
} from '@nx/devkit';
import { CreateNapiNpmDirsGeneratorSchema } from './schema';
import { runProcess } from '../../utils/run-process';

export default async function (
  tree: Tree,
  options: CreateNapiNpmDirsGeneratorSchema
) {
  const project = getProjects(tree).get(options.project);
  if (!project) {
    throw 'Project not found';
  }

  addNpmFiles(project);

  await formatFiles(tree);
}

function addNpmFiles(project: ProjectConfiguration) {
  const { exec } = getPackageManagerCommand();
  const command = `${exec} napi create-npm-dir`;
  runProcess(
    command,
    '-c',
    joinPathFragments(project.root, 'package.json'),
    '-t',
    project.root
  );
}
