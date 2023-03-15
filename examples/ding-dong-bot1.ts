#!/usr/bin/env -S node --no-warnings --loader ts-node/esm
/**
 * Wechaty - Conversational RPA SDK for Chatbot Makers.
 *  - https://github.com/wechaty/wechaty
 */
// https://stackoverflow.com/a/42817956/1123955
// https://github.com/motdotla/dotenv/issues/89#issuecomment-587753552
import 'dotenv/config.js'
import fetch from 'node-fetch';
import { FileBox }  from 'file-box'

import {
  Contact,
  Message,
  ScanStatus,
  WechatyBuilder,
  log,
}                  from 'wechaty'

import qrcodeTerminal from 'qrcode-terminal'
const API = 'http://localhost:3335'

function onScan (qrcode: string, status: ScanStatus) {
  if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
    const qrcodeImageUrl = [
      'https://wechaty.js.org/qrcode/',
      encodeURIComponent(qrcode),
    ].join('')
    log.info('StarterBot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)

    qrcodeTerminal.generate(qrcode, { small: true })  // show qrcode on console

  } else {
    log.info('StarterBot', 'onScan: %s(%s)', ScanStatus[status], status)
  }
}

let loginUserName: string = ""

async function onLogin (user: Contact) {
  
  // const roomList = await bot.Room.findAll()     
  // for (let it of roomList) {
  //   const topic = it?.payload?.topic
  //   console.log(topic)
  //   const room = await bot.Room.find({ topic });
  //   const contact = await bot.Contact.find({name: 'zhiyinchat'})   // change 'lijiarui' to any room member in the room you just set
  //   console.log(JSON.stringify(contact), 99999)
  //   // if (room) {
  //   //   try {
  //   //      await room.remove(contact)
  //   //   } catch(e) {
  //   //      console.error(e)
  //   //   }
  //   // }
  // }            // get the room list of the bot
  console.log('StarterBot', '%s login11111', user.name())
  loginUserName = user.name()
}

function onLogout (user: Contact) {
  log.info('StarterBot', '%s logout', user)
}

let list: {[key: string]: string[]} = {}
let tmpList: {[key: string]: string[]} = {}
let isReady = false

function onReady (res){
  console.log({res}, 'onReady')
  isReady = true
  list = {}
}

const bot = WechatyBuilder.build({
  name: 'ding-dong-bot',
  /**
   * How to set Wechaty Puppet Provider:
   *
   *  1. Specify a `puppet` option when instantiating Wechaty. (like `{ puppet: 'wechaty-puppet-whatsapp' }`, see below)
   *  1. Set the `WECHATY_PUPPET` environment variable to the puppet NPM module name. (like `wechaty-puppet-whatsapp`)
   *
   * You can use the following providers locally:
   *  - wechaty-puppet-wechat (web protocol, no token required)
   *  - wechaty-puppet-whatsapp (web protocol, no token required)
   *  - wechaty-puppet-padlocal (pad protocol, token required)
   *  - etc. see: <https://wechaty.js.org/docs/puppet-providers/>
   */
  // puppet: 'wechaty-puppet-whatsapp'

  /**
   * You can use wechaty puppet provider 'wechaty-puppet-service'
   *   which can connect to remote Wechaty Puppet Services
   *   for using more powerful protocol.
   * Learn more about services (and TOKEN) from https://wechaty.js.org/docs/puppet-services/
   */
  // puppet: 'wechaty-puppet-service'
  // puppetOptions: {
  //   token: 'xxx',
  // }
})

bot.on('scan',    onScan)
bot.on('login',   onLogin)
bot.on('logout',  onLogout)
bot.on('message', onMessage)
bot.on('ready',   onReady)

bot.start()
  .then(() => log.info('StarterBot', 'Starter Bot Started.'))
  .catch(e => log.error('StarterBot', e))


async function onMessage (msg: Message) {
  const contact = msg.talker()
  let text: string = msg.text()?.replace(
    new RegExp(`^@${loginUserName}`),
    ''
  ).trim()
  const requestImage1 = /^图片1: /.test(text)
  const requestImage2 = /^图片2: /.test(text)
  text = text.replace(/^图片1: /, '').replace(/^图片2: /, '')

  const isMyself = msg.self()
  let name = contact?.name()
  const room = msg.room()
  const topic = await room?.topic()
  const mention = await msg.mentionSelf()
  const key = `${topic}-${name}`
  const age = msg.age()
  // if(mention || text.includes("@"+loginUserName)){
  //   log.info('我被@了')
  // }

  if (!isMyself && isReady && age < 30) {

    console.log('1111111111111', JSON.stringify({
      text, 
      name, 
      isMyself, 
      list, 
      requestImage1, 
      requestImage2, 
      topic,
      mention,
      age,
      loginUserName,
      tmpList
    }))
    
    if (!text) {
      return await msg.say('hello~(*´▽｀)ノノ')
    } 

    // 在群里并且被@ 或者 聊天
    if ((topic && mention) || !topic) {
      log.info('2222222222222', JSON.stringify({topic, mention}))

      if (!list[key]?.length) {
        if (tmpList[key]?.length) {
          !tmpList[key]?.includes(text) && tmpList[key].push(text)
          if (tmpList[key]?.length > 5) {
            tmpList[key]?.unshift()
          }
        } else {
          !tmpList[key]?.includes(text) && (tmpList[key] = [text])
        }
      }
      
      if (list[key]?.length) {
        if (list[key]?.length >= 3) {
          return await msg.say('不要急，最重要是快，再催cpu就要🔥了')
        }
        !list[key]?.includes(text) && list[key].push(text)

        await msg.say('正在思考🤔中，请稍候')
      } else {
        !list[key]?.includes(text) && (list[key] = [text])

        await msg.say('请容我三思🤔')
        let uri = ''
        if (requestImage1) {
          uri = 'image'
        } else if(requestImage2) {
          uri = 'txaiart'
        } else {
          uri = 'say'
        }
        let response = await fetch(`${API}/zyj/${uri}`, {
          method: 'post',
          // body: JSON.stringify({prompt: tmpList[key]?.join(',')}),
          body: JSON.stringify({prompt: list[key]?.[0]}),
          headers: {'Content-Type': 'application/json'}
        })
        try {
          let { data } = await response.json();

          if(requestImage1 || requestImage2) {
            data.map(async (v) => {
              await msg.say(FileBox.fromUrl(v.url))
            })
          } else {
            data = data.replace(/^？\n{1}/,'').replace(/^<br><br>/,'')
            await msg.say(data)
          }

          list[key] = []
        } catch (e){
          list[key] = []
        }
        log.info('3333333333', JSON.stringify({list}))
      }
    }
  }

  // log.info('StarterBot2333', data)

  // await msg.say(data)
}