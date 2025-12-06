#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import chalk from 'chalk';
import open from 'open';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'ssinfo');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// --- Helpers ---

const ensureConfig = async () => {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (e) {
    // Ignore if exists
  }
};

const saveToken = async (token) => {
  await ensureConfig();
  await fs.writeFile(CONFIG_FILE, JSON.stringify({ token }), 'utf-8');
  console.log(chalk.green('✔ Token saved successfully!'));
};

const getToken = async () => {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data).token;
  } catch (e) {
    return null;
  }
};

const clearToken = async () => {
  try {
    await fs.unlink(CONFIG_FILE);
    console.log(chalk.green('✔ Logged out successfully.'));
  } catch (e) {
    console.log(chalk.yellow('ℹ You are not logged in.'));
  }
};

const searchGitHub = async (query, token) => {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'ssinfo-cli'
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=15`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 403) throw new Error("Rate limit exceeded. Please login with 'ssinfo login'.");
      if (response.status === 401) throw new Error("Invalid token. Please login again.");
      throw new Error(`GitHub API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items;
  } catch (error) {
    console.error(chalk.red(`\n✖ Error: ${error.message}`));
    process.exit(1);
  }
};

// --- Commands ---

const cmdLogin = async () => {
  console.log(chalk.blue('ℹ Generate a token at: https://github.com/settings/tokens'));
  const { token } = await inquirer.prompt([
    {
      type: 'password',
      name: 'token',
      message: 'Enter your GitHub Personal Access Token:',
      validate: input => input.trim().length > 0 ? true : 'Token is required'
    }
  ]);
  await saveToken(token);
};

const cmdSearch = async (query) => {
  const token = await getToken();
  
  console.log(chalk.dim(`Searching for "${query}"...`));
  const items = await searchGitHub(query, token);

  if (!items || items.length === 0) {
    console.log(chalk.yellow('No repositories found.'));
    return;
  }

  // Map items to inquirer choices
  const choices = items.map(repo => ({
    name: `${chalk.bold(repo.full_name.padEnd(40))} ${chalk.yellow('★ ' + repo.stargazers_count)}  ${chalk.dim(repo.description ? repo.description.slice(0, 50) + '...' : '')}`,
    value: repo.html_url
  }));

  choices.push(new inquirer.Separator());
  choices.push({ name: chalk.red('Exit'), value: 'EXIT' });

  const { selectedUrl } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedUrl',
      message: `Found ${items.length} repositories. Select one to open:`,
      pageSize: 15,
      choices
    }
  ]);

  if (selectedUrl === 'EXIT') {
    process.exit(0);
  } else {
    console.log(chalk.cyan(`Opening ${selectedUrl}...`));
    await open(selectedUrl);
  }
};

const printHelp = () => {
  console.log(chalk.bold.green('\n  ssinfo - GitHub CLI Explorer\n'));
  console.log('  Usage:');
  console.log(`    ${chalk.cyan('ssinfo <query>')}    Search for repositories`);
  console.log(`    ${chalk.cyan('ssinfo login')}      Save GitHub Access Token`);
  console.log(`    ${chalk.cyan('ssinfo logout')}     Remove saved token`);
  console.log(`    ${chalk.cyan('ssinfo help')}       Show this help message`);
  console.log('\n  Examples:');
  console.log(`    ssinfo react`);
  console.log(`    ssinfo "machine learning language:python"`);
  console.log('');
};

// --- Main ---

const main = async () => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  if (command === 'login') {
    await cmdLogin();
    return;
  }

  if (command === 'logout') {
    await clearToken();
    return;
  }

  // Treat all other args as a search query
  const query = args.join(' ');
  await cmdSearch(query);
};

main().catch(err => {
  console.error(chalk.red('Unexpected Error:'), err);
  process.exit(1);
});
