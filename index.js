import { join, dirname } from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { setupMaster, fork } from 'cluster';
import cfonts from 'cfonts';
import yargs from 'yargs';
import chalk from 'chalk';
import fs from 'fs';
import './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(__dirname);
const { say } = cfonts;

let isRunning = false;
let childProcess = null;

console.log(chalk.yellow.bold('—◉ㅤIniciando sistema...'));

function ensureAuthFolder() {
  const authPath = join(__dirname, global.authFile);
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }
}

function hasCredentials() {
  const credsPath = join(__dirname, global.authFile, 'creds.json');
  return fs.existsSync(credsPath);
}

function formatPhoneNumber(number) {
  let formatted = number.replace(/[^\d+]/g, '');
  if (formatted.startsWith('+52') && !formatted.startsWith('+521')) {
    formatted = formatted.replace('+52', '+521');
  } else if (formatted.startsWith('52') && !formatted.startsWith('521')) {
    formatted = `+521${formatted.slice(2)}`;
  } else if (formatted.startsWith('52') && formatted.length >= 12) {
    formatted = `+${formatted}`;
  } else if (!formatted.startsWith('+')) {
    formatted = `+${formatted}`;
  }
  return formatted;
}

function isValidPhoneNumber(phoneNumber) {
  const regex = /^\+\d{7,15}$/;
  return regex.test(phoneNumber);
}

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  say('SaZiki\nBot', {
    font: 'chrome',
    align: 'center',
    gradient: ['red', 'magenta'],
  });

  say('Bot Saziki || By Ali Nafis', {
    font: 'console',
    align: 'center',
    gradient: ['red', 'magenta'],
  });

  ensureAuthFolder();

  const args = [join(__dirname, file), ...process.argv.slice(2)];

  if (hasCredentials()) {
    setupMaster({ exec: args[0], args: args.slice(1) });
    forkProcess(file);
    return;
  }

  if (!global.botnumber) {
    console.log(chalk.bgRed(chalk.white.bold('\n❌ ERROR: No phone number configured.')));
    console.log(chalk.yellow.bold('Please set global.botnumber in config.js with your WhatsApp number.'));
    console.log(chalk.white.bold('Example: +5219992095479\n'));
    process.exit(1);
  }

  const phoneNumber = formatPhoneNumber(global.botnumber);

  if (!isValidPhoneNumber(phoneNumber)) {
    console.log(chalk.bgRed(chalk.white.bold('\n❌ ERROR: Invalid phone number format.')));
    console.log(chalk.yellow.bold('Please ensure your number includes the country code.'));
    console.log(chalk.white.bold('Example: +5219992095479\n'));
    process.exit(1);
  }

  console.log(chalk.green.bold(`—◉ㅤUsing phone number: ${phoneNumber}`));
  console.log(chalk.green.bold('—◉ㅤInitiating pairing code login...'));

  process.argv.push('--phone=' + phoneNumber.replace('+', ''));
  process.argv.push('--method=code');

  setupMaster({ exec: args[0], args: args.slice(1) });
  forkProcess(file);
}

function forkProcess(file) {
  childProcess = fork();

  childProcess.on('message', (data) => {
    console.log(chalk.green.bold('—◉ㅤRECEIVED:'), data);
    switch (data) {
      case 'reset':
        console.log(chalk.yellow.bold('—◉ㅤRestart request received...'));
        childProcess.removeAllListeners();
        childProcess.kill('SIGTERM');
        isRunning = false;
        setTimeout(() => start(file), 1000);
        break;
      case 'uptime':
        childProcess.send(process.uptime());
        break;
    }
  });

  childProcess.on('exit', (code, signal) => {
    console.log(chalk.yellow.bold(`—◉ㅤChild process terminated (${code || signal})`));
    isRunning = false;
    childProcess = null;

    if (code !== 0 || signal === 'SIGTERM') {
      console.log(chalk.yellow.bold('—◉ㅤRestarting process...'));
      setTimeout(() => start(file), 1000);
    }
  });
}

try {
  start('main.js');
} catch (error) {
  console.error(chalk.red.bold('[ CRITICAL ERROR ]:'), error);
  process.exit(1);
}