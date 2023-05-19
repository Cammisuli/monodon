import { Tree, updateJson } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { normalizeOptions } from './normalize-options';

describe('normalize options', () => {
  let appTree: Tree;

  beforeEach(() => {
    appTree = createTreeWithEmptyWorkspace();
  });

  it('should normalize options for an app', () => {
    const options = normalizeOptions(appTree, 'app', {
      name: 'test-name',
      directory: 'test-directory/sub/sub-two',
      tags: 'test-tag, test-tag-two',
    });
    expect(options).toMatchInlineSnapshot(`
      Object {
        "directory": "test-directory/sub/sub-two",
        "edition": "2021",
        "name": "test-name",
        "parsedTags": Array [
          "test-tag",
          "test-tag-two",
        ],
        "projectDirectory": "test_directory/sub/sub_two/test_name",
        "projectName": "test_directory_sub_sub_two_test_name",
        "projectRoot": "./test_directory/sub/sub_two/test_name",
        "tags": "test-tag, test-tag-two",
        "targetDir": "dist/target/test_directory_sub_sub_two_test_name",
      }
    `);
  });
  it('should normalize options for a lib', () => {
    const options = normalizeOptions(appTree, 'lib', {
      name: 'test-name',
      directory: 'test-directory/sub/sub-two',
      tags: 'test-tag, test-tag-two',
    });
    expect(options).toMatchInlineSnapshot(`
      Object {
        "directory": "test-directory/sub/sub-two",
        "edition": "2021",
        "name": "test-name",
        "parsedTags": Array [
          "test-tag",
          "test-tag-two",
        ],
        "projectDirectory": "test_directory/sub/sub_two/test_name",
        "projectName": "test_directory_sub_sub_two_test_name",
        "projectRoot": "./test_directory/sub/sub_two/test_name",
        "tags": "test-tag, test-tag-two",
        "targetDir": "dist/target/test_directory_sub_sub_two_test_name",
      }
    `);
  });

  it('should handle empty appsDir or libsDir', () => {
    updateJson(appTree, 'nx.json', (json) => {
      json.workspaceLayout = {
        appsDir: '',
        libsDir: '',
      };
      return json;
    });
    const options = normalizeOptions(appTree, 'lib', {
      name: 'test-name',
    });

    expect(options).toMatchInlineSnapshot(`
      Object {
        "edition": "2021",
        "name": "test-name",
        "parsedTags": Array [],
        "projectDirectory": "test_name",
        "projectName": "test_name",
        "projectRoot": "test_name",
        "targetDir": "dist/target/test_name",
      }
    `);
  });
});
