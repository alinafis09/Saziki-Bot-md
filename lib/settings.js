// lib/settings.js - Configuración centralizada para el bot

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ==================== CONFIGURACIÓN DEL PROPIETARIO ====================
export const owner = {
  // Números de los propietarios (formato internacional sin +)
  // IMPORTANTE: Asegúrate de que tu número esté aquí exactamente como aparece en WhatsApp
  numbers: [
    '261125656551615@s.whatsapp.net',  // Tu número de la imagen
    '261125656551615@s.whatsapp.net',  // El número que aparece en la imagen como owner
    '261125656551615@s.whatsapp.net',  // Duplicado para asegurar
    '261125656551615@s.whatsapp.net',     // Sin código de país también
    '261125656551615@s.whatsapp.net'  // Ejemplo de otro owner
  ],
  
  // Nombres de los propietarios (en el mismo orden que los números)
  names: [
    'Mareyo',        // Tu nombre de la imagen (Instagram: mareyo.edits)
    'Ali Nafis',     // El otro owner
    'Mareyo',        // Duplicado
    'Mareyo',        // Duplicado
    'Propietario 2'
  ],
  
  // Email de contacto
  email: 'mareyo.edits@example.com',
  
  // Número principal para mostrar en el bot
  mainNumber: '261125656551615@s.whatsapp.net',
  
  // Nombre del creador
  creatorName: 'Mareyo',
  
  // Alias del creador
  creatorAlias: '@mareyo.edits',
  
  // Instagram del creador
  instagram: 'https://www.instagram.com/mareyo.edits',
  
  // WhatsApp del creador
  whatsapp: 'https://wa.me/212719558797',
  
  // Grupo oficial
  groupLink: 'https://chat.whatsapp.com/HsiI2G8qVGS9W8Rjo6Hzvh',
  
  // IDs de los propietarios (para usar en el código)
  get jids() {
    return this.numbers.map(num => num + '@s.whatsapp.net');
  },
  
  // Verificar si un número es propietario - VERSIÓN MEJORADA
  isOwner(number) {
    if (!number) return false;
    
    // Limpiar el número de entrada (eliminar @s.whatsapp.net, espacios, etc.)
    const cleanNumber = number.toString()
      .replace(/[^0-9]/g, '')  // Eliminar todo excepto dígitos
      .replace(/^\+/, '');      // Eliminar + si existe
    
    console.log(`🔍 Verificando si ${cleanNumber} es owner...`);
    
    // Verificar contra todos los números en la lista
    const isOwner = this.numbers.some(ownerNum => {
      const cleanOwnerNum = ownerNum.toString().replace(/[^0-9]/g, '');
      
      // Comparación exacta
      if (cleanOwnerNum === cleanNumber) {
        console.log(`✅ Coincidencia exacta: ${cleanOwnerNum} === ${cleanNumber}`);
        return true;
      }
      
      // Si el número del owner termina con el número limpio (para casos con código de país diferente)
      if (cleanOwnerNum.endsWith(cleanNumber) && cleanNumber.length >= 9) {
        console.log(`✅ Coincidencia por terminación: ${cleanOwnerNum} termina con ${cleanNumber}`);
        return true;
      }
      
      // Si el número limpio termina con el número del owner
      if (cleanNumber.endsWith(cleanOwnerNum) && cleanOwnerNum.length >= 9) {
        console.log(`✅ Coincidencia por terminación inversa: ${cleanNumber} termina con ${cleanOwnerNum}`);
        return true;
      }
      
      return false;
    });
    
    if (isOwner) {
      console.log(`👑 ${cleanNumber} es propietario del bot`);
    } else {
      console.log(`❌ ${cleanNumber} NO es propietario del bot`);
    }
    
    return isOwner;
  },
  
  // Obtener nombre del propietario por número
  getOwnerName(number) {
    const cleanNumber = number.toString().replace(/[^0-9]/g, '');
    const index = this.numbers.findIndex(ownerNum => {
      const cleanOwnerNum = ownerNum.toString().replace(/[^0-9]/g, '');
      return cleanOwnerNum === cleanNumber || 
             cleanOwnerNum.endsWith(cleanNumber) || 
             cleanNumber.endsWith(cleanOwnerNum);
    });
    return index !== -1 ? this.names[index] : this.creatorName;
  }
};

// ==================== CONFIGURACIÓN DEL BOT ====================
export const bot = {
  // Nombre del bot (según la imagen: Saziki Bot / Laziki bot)
  name: 'Saziki Bot',
  
  // Nombre alternativo
  altName: 'Laziki bot',
  
  // Versión del bot
  version: '2.0.0',
  
  // Prefijo por defecto
  defaultPrefix: '.',
  
  // Prefijos permitidos
  allowedPrefixes: ['.', '#', '!', '/'],
  
  // Idioma por defecto (es = español)
  defaultLanguage: 'es',
  
  // Zona horaria
  timezone: 'Africa/Casablanca',  // Para Marruecos
  
  // Formato de fecha
  dateFormat: 'DD/MM/YYYY',
  
  // Formato de hora
  timeFormat: 'HH:mm:ss',
  
  // Mensaje de bienvenida por defecto
  defaultWelcome: '¡Bienvenido @user al grupo @subject!',
  
  // Mensaje de despedida por defecto
  defaultBye: '¡Adiós @user!',
  
  // Límites por defecto
  defaultLimits: {
    daily: 20,
    weekly: 100,
    monthly: 500,
    commandCooldown: 5, // segundos
  },
  
  // Características del bot
  features: {
    antiSpam: true,
    antiCall: true,
    antiLink: true,
    antiToxic: true,
    antiDelete: true,
    welcomeMessage: true,
    autoReadMessages: false,
    autoBlockCalls: true,
  },
  
  // Emojis del bot
  emojis: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    owner: '👑',
    admin: '🛡️',
    premium: '💎',
    group: '👥',
    private: '🔒',
    download: '📥',
    upload: '📤',
    game: '🎮',
    utility: '🛠️',
    ai: '🤖',
    time: '⏰',
    date: '📆',
    level: '📊',
    user: '👤',
    bot: '🤖',
    link: '🔗',
    heart: '❤️',
    star: '⭐',
    fire: '🔥',
    crown: '👑',
    shield: '🛡️',
    globe: '🌐',
    mail: '📧',
    phone: '📱',
    github: '📂',
    youtube: '▶️',
    instagram: '📸',
    telegram: '📨',
    tiktok: '🎵',
    twitter: '🐦',
    facebook: '👤',
    web: '🌐'
  }
};

// ==================== REDES SOCIALES ====================
export const social = {
  // GitHub
  github: {
    username: 'mareyo-edits',
    url: 'https://github.com/mareyo-edits',
    repository: 'https://github.com/mareyo-edits/saziki-bot',
  },
  
  // Instagram (según la imagen)
  instagram: {
    username: 'mareyo.edits',
    url: 'https://www.instagram.com/mareyo.edits',
  },
  
  // WhatsApp (según la imagen)
  whatsapp: {
    personal: 'https://wa.me/212719558797',
    channel: 'https://whatsapp.com/channel/...',
    group: 'https://chat.whatsapp.com/HsiI2G8qVGS9W8Rjo6Hzvh',
  },
  
  // Obtener todas las redes formateadas
  getAllFormatted() {
    return {
      instagram: `📸 *Instagram:* ${this.instagram.url}`,
      whatsapp: `📱 *WhatsApp:* ${this.whatsapp.personal}`,
      group: `👥 *Grupo:* ${this.whatsapp.group}`,
      github: `📂 *GitHub:* ${this.github.url}`,
    };
  }
};

// ==================== GRUPOS Y CANALES ====================
export const communities = {
  // Grupos oficiales
  groups: [
    {
      name: 'Laziki Bot - Grupo Oficial',
      link: 'https://chat.whatsapp.com/HsiI2G8qVGS9W8Rjo6Hzvh',
      id: 'HsiI2G8qVGS9W8Rjo6Hzvh',
      description: 'Grupo principal del bot',
      language: 'es',
      category: 'general',
    },
  ],
  
  // Obtener link de grupo por categoría
  getGroupLink(category = 'general') {
    const group = this.groups.find(g => g.category === category);
    return group ? group.link : null;
  },
  
  // Obtener todos los grupos formateados
  getAllGroupsFormatted() {
    return this.groups.map(g => `• ${g.name}: ${g.link}`).join('\n');
  }
};

// ==================== MENSAJES PREDEFINIDOS ====================
export const messages = {
  // Mensajes de error
  errors: {
    ownerOnly: `> ${bot.emojis.warning} *This command can only be used by the bot owner𓂀*`,
    modsOnly: `> ${bot.emojis.warning} *Este comando solo puede ser usado por moderadores.*`,
    premiumOnly: `> ${bot.emojis.warning} *Este comando solo puede ser usado por usuarios premium.*`,
    groupOnly: `> ${bot.emojis.warning} *Este comando solo puede ser usado en grupos.*`,
    privateOnly: `> ${bot.emojis.warning} *Este comando solo puede ser usado en chats privados.*`,
    adminOnly: `${bot.emojis.warning} *Este comando solo puede ser usado por administradores del grupo.*`,
    botAdmin: `> ${bot.emojis.warning} *Necesito ser administrador para ejecutar este comando.*`,
    notRegistered: `> ${bot.emojis.warning} *Debes registrarte para usar este comando. Usa #register nombre.edad*`,
    featureDisabled: `> ${bot.emojis.warning} *Esta función está deshabilitada.*`,
    invalidNumber: `> ${bot.emojis.error} *Número de teléfono inválido.*`,
    insufficientLimit: `> ${bot.emojis.error} *No tienes suficientes límites.*`,
    insufficientLevel: `> ${bot.emojis.error} *Necesitas nivel %level% para usar este comando.*`,
    cooldown: `> ${bot.emojis.time} *Espera %time% segundos antes de usar otro comando.*`,
    banned: `> ${bot.emojis.error} *Has sido baneado.*\n*Motivo:* %reason%`,
  },
  
  // Mensajes de éxito
  success: {
    registered: `${bot.emojis.success} *Registro exitoso!*\n\n*Nombre:* %name%\n*Edad:* %age%\n*Registrado como:* @%user%`,
    limitAdded: `${bot.emojis.success} *Se agregaron %amount% límites a tu cuenta.*`,
    premiumActivated: `${bot.emojis.premium} *Premium activado hasta:* %date%`,
    commandExecuted: `${bot.emojis.success} *Comando ejecutado correctamente.*`,
    settingsUpdated: `${bot.emojis.success} *Configuración actualizada.*`,
  },
  
  // Mensajes informativos
  info: {
    botInfo: `${bot.emojis.bot} *INFORMACIÓN DEL BOT*\n\n` +
      `${bot.emojis.user} *Nombre:* %name%\n` +
      `${bot.emojis.star} *Versión:* %version%\n` +
      `${bot.emojis.owner} *Creador:* %creator%\n` +
      `${bot.emojis.globe} *Prefijo:* %prefix%\n` +
      `${bot.emojis.time} *Uptime:* %uptime%\n` +
      `${bot.emojis.group} *Grupos:* %groups%\n` +
      `${bot.emojis.user} *Usuarios:* %users%`,
    
    creatorInfo: `${bot.emojis.owner} *INFORMACIÓN DEL CREADOR*\n\n` +
      `${bot.emojis.user} *Nombre:* %name%\n` +
      `${bot.emojis.phone} *Número:* wa.me/%number%\n` +
      `${bot.emojis.mail} *Email:* %email%\n` +
      `${bot.emojis.instagram} *Instagram:* %instagram%\n` +
      `${bot.emojis.github} *GitHub:* %github%`,
    
    menuHeader: `┏━━「 *%name%* 」━━┓\n` +
      `┃\n` +
      `┃ ${bot.emojis.user} Hola, *%user%*\n` +
      `┃ ${bot.emojis.date} Fecha: %date%\n` +
      `┃ ${bot.emojis.time} Hora: %time%\n` +
      `┃ ${bot.emojis.level} Nivel: %level%\n` +
      `┃ ${bot.emojis.premium} Premium: %premium%\n` +
      `┃\n` +
      `┗━━━━━━━━━━━━┛\n\n`,
  },
  
  // Mensajes de ayuda
  help: {
    general: `${bot.emojis.globe} *COMANDOS DISPONIBLES*\n\n` +
      `Usa *%prefix%menu* para ver el menú principal\n` +
      `Usa *%prefix%help [categoría]* para ayuda específica\n\n` +
      `*Categorías disponibles:*\n`,
    
    categoryHeader: `┏━━「 *%category%* 」━━┓\n┃\n`,
    commandFormat: `┃ ${bot.emojis.star} *%prefix%%command%* %params%\n┃   ↳ %description%\n`,
  },
};

// ==================== FUNCIONES DE UTILIDAD ====================

/**
 * Obtiene la información completa del propietario principal
 * @returns {object} Información del propietario
 */
export function getMainOwner() {
  return {
    number: owner.mainNumber,
    name: owner.creatorName,
    email: owner.email,
    creatorName: owner.creatorName,
    alias: owner.creatorAlias,
    instagram: owner.instagram,
    whatsapp: owner.whatsapp,
    groupLink: owner.groupLink,
    jid: owner.mainNumber + '@s.whatsapp.net'
  };
}

/**
 * Obtiene el mensaje de error personalizado
 * @param {string} key - Clave del mensaje
 * @param {object} params - Parámetros para reemplazar
 * @returns {string} Mensaje formateado
 */
export function getErrorMessage(key, params = {}) {
  let message = messages.errors[key] || messages.errors.ownerOnly;
  Object.keys(params).forEach(param => {
    message = message.replace(new RegExp(`%${param}%`, 'g'), params[param]);
  });
  return message;
}

/**
 * Obtiene el mensaje de éxito personalizado
 * @param {string} key - Clave del mensaje
 * @param {object} params - Parámetros para reemplazar
 * @returns {string} Mensaje formateado
 */
export function getSuccessMessage(key, params = {}) {
  let message = messages.success[key] || messages.success.commandExecuted;
  Object.keys(params).forEach(param => {
    message = message.replace(new RegExp(`%${param}%`, 'g'), params[param]);
  });
  return message;
}

/**
 * Obtiene la información de redes sociales formateada
 * @returns {string} Texto formateado con redes sociales
 */
export function getSocialInfo() {
  const socials = social.getAllFormatted();
  
  return `${bot.emojis.globe} *REDES SOCIALES*\n\n` +
    Object.values(socials).join('\n') +
    `\n\n${bot.emojis.group} *Grupo Oficial:*\n${communities.getAllGroupsFormatted()}`;
}

/**
 * Formatea fecha actual
 * @returns {string} Fecha formateada
 */
export function getCurrentDate() {
  const d = new Date();
  return d.toLocaleDateString('es', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
}

/**
 * Formatea hora actual
 * @returns {string} Hora formateada
 */
export function getCurrentTime() {
  const d = new Date();
  return d.toLocaleString('en-US', { 
    hour: 'numeric', 
    minute: 'numeric', 
    second: 'numeric', 
    hour12: true 
  });
}

/**
 * Calcula el tiempo de actividad
 * @param {number} uptime - Tiempo de actividad en ms
 * @returns {string} Tiempo formateado
 */
export function formatUptime(uptime) {
  const d = Math.floor(uptime / 86400000);
  const h = Math.floor(uptime / 3600000) % 24;
  const m = Math.floor(uptime / 60000) % 60;
  const s = Math.floor(uptime / 1000) % 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}

// Exportar todo junto para facilitar el acceso
export default {
  owner,
  bot,
  social,
  communities,
  messages,
  getMainOwner,
  getErrorMessage,
  getSuccessMessage,
  getSocialInfo,
  getCurrentDate,
  getCurrentTime,
  formatUptime,
  isOwner: owner.isOwner
};