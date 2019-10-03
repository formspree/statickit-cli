const execa = require('execa');
const fs = require('fs').promises;
require('dotenv').config();

it('returns help output', async () => {
  const { stdout } = await execa('bin/statickit', ['--help']);
  expect(stdout).toMatch(/Performs a deployment/);
});

it('returns an error if no config is present', async () => {
  try {
    await execa('bin/statickit', ['deploy']);
  } catch (result) {
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/Configuration not provided/);
  }
});

it('returns an error if config is unparsable', async () => {
  try {
    await execa('bin/statickit', ['deploy', '-c', "'{'"]);
  } catch (result) {
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/Configuration could not be parsed/);
  }
});

it('returns an error if deploy key is not found', async () => {
  try {
    await execa('bin/statickit', ['deploy', '-c', "'{}'"]);
  } catch (result) {
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/Deploy key not found/);
  }
});

it('returns an error if deploy key is invalid', async () => {
  try {
    await execa('bin/statickit', ['deploy', '-c', "'{}'", '-k', 'invalidkey']);
  } catch (result) {
    console.log(result);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/Deploy key is not valid/);
  }
});

it('succeeds given valid params', async () => {
  const { stdout } = await execa('bin/statickit', [
    'deploy',
    '-c',
    "'{}'",
    '-k',
    process.env.STATICKIT_TEST_DEPLOY_KEY
  ]);
  expect(stdout).toMatch(/Deployment succeeded/);
});

it('accepts a deploy key from env', async () => {
  const { stdout } = await execa('bin/statickit', ['deploy', '-c', "'{}'"], {
    env: { STATICKIT_DEPLOY_KEY: process.env.STATICKIT_TEST_DEPLOY_KEY }
  });
  expect(stdout).toMatch(/Deployment succeeded/);
});

it('accepts a config from the statickit.json file', async () => {
  await fs.writeFile('statickit.json', '{}', 'utf8');

  const { stdout } = await execa('bin/statickit', ['deploy'], {
    env: { STATICKIT_DEPLOY_KEY: process.env.STATICKIT_TEST_DEPLOY_KEY }
  });
  expect(stdout).toMatch(/Deployment succeeded/);

  await fs.unlink('statickit.json');
});