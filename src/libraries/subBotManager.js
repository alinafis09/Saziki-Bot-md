const {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  jidNormalizedUser
} = await import("@whiskeysockets/baileys");

import fs from 'fs';
import pino from 'pino';
import 'md5';
import 'child_process';
import { makeWASocket } from './simple.js';
import store from './store.js';
import NodeCache from 'node-cache';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JADIBTS_DIR = path.join(__dirname, "../../jadibts");

if (!(global.conns instanceof Array)) {
  global.conns = [];
}

if (!(global.dataconst instanceof Array)) {
  global.dataconst = [];
}

export async function initializeSubBots() {
  try {
    const modejadibot = global.db?.data?.settings?.[global.conn?.user?.jid]?.modejadibot ?? true;
    
    if (!modejadibot) {
      console.log("[SUB-BOT] Modo jadibot desactivado en configuración del Bot Principal");
      return;
    }
    
    if (!fs.existsSync(JADIBTS_DIR)) {
      console.log("[SUB-BOT] No hay sub-bots previamente conectados");
      return;
    }
    
    const sessions = fs.readdirSync(JADIBTS_DIR);
    
    for (const session of sessions) {
      try {
        const credsPath = path.join(JADIBTS_DIR, session, 'creds.json');
        if (!fs.existsSync(credsPath)) continue;
        
        const credsData = fs.readFileSync(credsPath, "utf-8");
        const creds = JSON.parse(credsData);
        
        if (creds.fstop === true) continue;
        
        console.log("[SUB-BOT] Iniciando sub-bot " + session);
        await startSubBot(session, credsData);
      } catch (error) {
        console.error("[SUB-BOT] Error al iniciar sub-bot " + session + ':', error);
      }
    }
  } catch (error) {
    console.error("[SUB-BOT] Error en initializeSubBots:", error);
  }
}

async function startSubBot(sessionName, credsData) {
  try {
    const sessionPath = path.join(JADIBTS_DIR, sessionName);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    const msgRetryCounterCache = new NodeCache();
    const { version } = await fetchLatestBaileysVersion();
    
    const connectionOptions = {
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" }))
      },
      logger: pino({ level: "silent" }),
      browser: ["TheMystic-Bot-MD", 'Safari', "2.0.0"],
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      getMessage: async (key) => {
        let jid = jidNormalizedUser(key.remoteJid);
        let msg = await store.loadMessage(jid, key.id);
        return msg?.message || '';
      },
      msgRetryCounterCache,
      defaultQueryTimeoutMs: undefined,
      version
    };
    
    let conn = makeWASocket(connectionOptions);
    conn.isInit = false;
    conn.uptime = Date.now();
    
    let isInit = true;
    
    async function connectionUpdate(update) {
      const { connection, lastDisconnect, isNewLogin } = update;
      
      if (isNewLogin) {
        conn.isInit = false;
      }
      
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      
      if (connection === "close") {
        if (conn.user && dataconst[conn.user.id.split('@')] == 3) {
          console.log("[SUB-BOT] Límite de reconexiones alcanzado para " + sessionName);
          return;
        }
        
        if (statusCode == 405 || statusCode == 404) {
          fs.unlinkSync(path.join(JADIBTS_DIR, sessionName, 'creds.json'));
          return startSubBot(sessionName, credsData);
        }
        
        if (statusCode === DisconnectReason.badSession) {
          console.log("[SUB-BOT] Sesión inválida para " + sessionName);
          fs.rmSync(path.join(JADIBTS_DIR, sessionName), { recursive: true, force: true });
        } else if (statusCode === DisconnectReason.connectionClosed) {
          if (conn.fstop) {
            console.log("[SUB-BOT] " + sessionName + " apagado correctamente");
            return;
          }
          console.log("[SUB-BOT] Reconectando " + sessionName + " (" + (dataconst[conn.user?.id?.split('@')] || 0) + "/3)");
          await reloadHandler(true).catch(console.error);
        } else if (statusCode === DisconnectReason.connectionLost) {
          console.log("[SUB-BOT] " + sessionName + " perdió conexión, reconectando...");
          await reloadHandler(true).catch(console.error);
        } else if (statusCode === DisconnectReason.connectionReplaced) {
          console.log("[SUB-BOT] " + sessionName + " fue reemplazado");
          await reloadHandler(true).catch(console.error);
        } else if (statusCode === DisconnectReason.loggedOut) {
          console.log("[SUB-BOT] " + sessionName + " cerró sesión");
          fs.rmSync(path.join(JADIBTS_DIR, sessionName), { recursive: true, force: true });
        } else if (statusCode === DisconnectReason.restartRequired) {
          console.log("[SUB-BOT] " + sessionName + " requiere reinicio");
          await reloadHandler(true).catch(console.error);
        } else if (statusCode === DisconnectReason.timedOut) {
          console.log("[SUB-BOT] " + sessionName + " timeout, reconectando...");
          await reloadHandler(true).catch(console.error);
        } else {
          console.log("[SUB-BOT] " + sessionName + " desconectado por razón desconocida: " + statusCode);
        }
        
        let index = global.conns.indexOf(conn);
        if (index < 0) return;
        
        delete global.conns[index];
        global.conns.splice(index, 1);
      }
      
      if (connection == "open") {
        conn.isInit = true;
        global.conns.push(conn);
        console.log("[SUB-BOT] +" + sessionName + " conectado con éxito");
        
        if (connection === 'open') {
          dataconst[conn.user.id.split('@')] = 1;
        }
      }
    }
    
    setInterval(async () => {
      if (!conn.user) {
        try {
          conn.ws.close();
        } catch {}
        conn.ev.removeAllListeners();
        
        let index = global.conns.indexOf(conn);
        if (index < 0) return;
        
        delete global.conns[index];
        global.conns.splice(index, 1);
      }
    }, 60000);
    
    let handler;
    
    let reloadHandler = async function(restartConn) {
      try {
        const handlerPath = path.join(__dirname, '../../handler.js');
        const imported = await import(handlerPath + "?update=" + Date.now()).catch(console.error);
        if (Object.keys(imported || {}).length) {
          handler = imported;
        }
      } catch (error) {
        console.error("[SUB-BOT] Error al cargar handler:", error);
        return;
      }
      
      if (!handler || !handler.handler) {
        console.error("[SUB-BOT] Handler no definido o incompleto");
        return;
      }
      
      if (restartConn) {
        try {
          conn.ws.close();
        } catch {}
        conn.ev.removeAllListeners();
        conn = makeWASocket(connectionOptions);
        isInit = true;
      }
      
      if (conn.user && conn.user.id && !dataconst[conn.user.id.split('@')]) {
        dataconst[conn.user.id.split('@')] = 0;
      }
      
      if (conn.user && conn.user.id && dataconst[conn.user.id.split('@')] && restartConn) {
        dataconst[conn.user.id.split('@')]++;
      }
      
      if (!isInit) {
        store.bind(conn);
        conn.ev.off("messages.upsert", conn.handler);
        conn.ev.off('group-participants.update', conn.participantsUpdate);
        conn.ev.off('groups.update', conn.groupsUpdate);
        conn.ev.off("message.delete", conn.onDelete);
        conn.ev.off("call", conn.onCall);
        conn.ev.off("connection.update", conn.connectionUpdate);
        conn.ev.off("creds.update", conn.credsUpdate);
      }
      
      conn.handler = handler.handler.bind(conn);
      conn.participantsUpdate = handler.participantsUpdate.bind(conn);
      conn.groupsUpdate = handler.groupsUpdate.bind(conn);
      conn.onDelete = handler.deleteUpdate.bind(conn);
      conn.onCall = handler.callUpdate.bind(conn);
      conn.connectionUpdate = connectionUpdate.bind(conn);
      conn.credsUpdate = saveCreds.bind(conn, true);
      
      conn.ev.on("messages.upsert", conn.handler);
      conn.ev.on("group-participants.update", conn.participantsUpdate);
      conn.ev.on("groups.update", conn.groupsUpdate);
      conn.ev.on("message.delete", conn.onDelete);
      conn.ev.on("call", conn.onCall);
      conn.ev.on("connection.update", conn.connectionUpdate);
      conn.ev.on("creds.update", conn.credsUpdate);
      
      conn.subreloadHandler = reloadHandler;
      isInit = false;
      return true;
    };
    
    await reloadHandler(false);
  } catch (error) {
    console.error("[SUB-BOT] Error al iniciar sub-bot " + sessionName + ':', error);
  }
}