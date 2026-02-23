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

function verificarOCrearCarpetaAuth() {
  const authPath = join(__dirname, global.authFile);
  if (!fs.existsSync(authPath)) {
    fs.mkdirSync(authPath, { recursive: true });
  }
}

function verificarCredsJson() {
  const credsPath = join(__dirname, global.authFile, 'creds.json');
  return fs.existsSync(credsPath);
}

function formatearNumeroTelefono(numero) {
  let formattedNumber = numero.replace(/[^\d+]/g, '');
  if (formattedNumber.startsWith('+52') && !formattedNumber.startsWith('+521')) {
    formattedNumber = formattedNumber.replace('+52', '+521');
  } else if (formattedNumber.startsWith('52') && !formattedNumber.startsWith('521')) {
    formattedNumber = `+521${formattedNumber.slice(2)}`;
  } else if (formattedNumber.startsWith('52') && formattedNumber.length >= 12) {
    formattedNumber = `+${formattedNumber}`;
  } else if (!formattedNumber.startsWith('+')) {
    formattedNumber = `+${formattedNumber}`;
  }
  return formattedNumber;
}

function esNumeroValido(numeroTelefono) {
  const regex = /^\+\d{7,15}$/;
  return regex.test(numeroTelefono);
}

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  say('SaZiki\nBot', {
    font: 'chrome',
    align: 'center',
    gradient: ['red', 'magenta'],
  });

  say(`Bot Saziki || By Ali Nafis`, {
    font: 'console',
    align: 'center',
    gradient: ['red', 'magenta'],
  });

  verificarOCrearCarpetaAuth();

  // If credentials exist, start normally
  if (verificarCredsJson()) {
    const args = [join(__dirname, file), ...process.argv.slice(2)];
    setupMaster({ exec: args[0], args: args.slice(1) });
    forkProcess(file);
    return;
  }

  // Check if botnumber is configured
  if (!global.botnumber) {
    console.log(chalk.bgRed(chalk.white.bold('\n❌ ERROR: No phone number configured.')));
    console.log(chalk.yellow.bold('Please set global.botnumber in config.js with your WhatsApp number.'));
    console.log(chalk.white.bold('Example: +5219992095479\n'));
    process.exit(1);
  }

  // Format and validate the phone number
  const numeroTelefono = formatearNumeroTelefono(global.botnumber);
  
  if (!esNumeroValido(numeroTelefono)) {
    console.log(chalk.bgRed(chalk.white.bold('\n❌ ERROR: Invalid phone number format.')));
    console.log(chalk.yellow.bold('Please ensure your number includes the country code.'));
    console.log(chalk.white.bold('Example: +5219992095479\n'));
    process.exit(1);
  }

  // Automatically use pairing code method with configured number
  console.log(chalk.green.bold(`—◉ㅤUsing phone number: ${numeroTelefono}`));
  console.log(chalk.green.bold('—◉ㅤInitiating pairing code login...'));
  
  // Push arguments for main process
  process.argv.push('--phone=' + numeroTelefono);
  process.argv.push('--method=code');
  
  const args = [join(__dirname, file), ...process.argv.slice(2)];
  setupMaster({ exec: args[0], args: args.slice(1) });
  forkProcess(file);
}

function forkProcess(file) {
  childProcess = fork();

  childProcess.on('message', (data) => {
    console.log(chalk.green.bold('—◉ㅤRECIBIDO:'), data);
    switch (data) {
      case 'reset':
        console.log(chalk.yellow.bold('—◉ㅤSolicitud de reinicio recibida...'));
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
    console.log(chalk.yellow.bold(`—◉ㅤProceso secundario terminado (${code || signal})`));
    isRunning = false;
    childProcess = null;
    
    if (code !== 0 || signal === 'SIGTERM') {
      console.log(chalk.yellow.bold('—◉ㅤReiniciando proceso...'));
      setTimeout(() => start(file), 1000);
    }
  });
}

try {
  start('main.js');
} catch (error) {
  console.error(chalk.red.bold('[ ERROR CRÍTICO ]:'), error);
  process.exit(1);
}
