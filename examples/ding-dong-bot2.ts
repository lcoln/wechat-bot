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
const API = 'http://170.106.168.8:3335'

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
  console.log('StarterBot', '%s login11111', user.name())
  loginUserName = user.name()
}

function onLogout (user: Contact) {
  log.info('StarterBot', '%s logout', user)
}

let list: {[key: string]: boolean} = {}
let isReady = false

function onReady (res){
  console.log({res}, 'onReady')
  isReady = true
  list = {}
}

const bot = WechatyBuilder.build({
  name: 'ding-dong-bot',
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
  
  if (!isMyself && isReady && age < 300) {
    
    if (!text) {
      return await msg.say('hello~(*´▽｀)ノノ')
    } 
    console.log({age, text, topic, mention, isMyself, name})

    // 在群里并且被@ 或者 聊天
    if ((topic && mention) || !topic) {
      if (list[key]) {
        return await msg.say('正在思考🤔中，请稍候')
      }
      list[key] = true

      await msg.say('请容我三思🤔')
      let uri = requestImage1 ? 'image' : (requestImage2 ? 'txaiart' : 'sayU')
      const params = uri === 'sayU' ? {
        "message": [
          {"role": "user", "content": text}
        ]
      } : {prompt: text}
      console.log(`${API}/zyj/${uri}`, 99999)
      
      let response = await fetch(`${API}/zyj/${uri}`, {
        method: 'post',
        body: JSON.stringify(params),
        headers: {'Content-Type': 'application/json', Authorization: 'coln'}
      })
      try {
        let {data} = await response.json();
        console.log({requestImage2})
        // .say({
        //   type: bot.Message.Type.Image,
        //   content: base64Data
        // });
        if (data) {
          if(requestImage1) {
            data.map(async (v) => {
              await msg.say(FileBox.fromUrl(v.url))
            })
          } else if(requestImage2) {
            const contact1 = await bot.Contact.find({name})  // change 'lijiarui' to any of your contact name in wechat
            const file = FileBox.fromBase64(`data:image/jpg;base64,${data.base64}`, 'test.png')
            console.log(111111)
            // await msg?.from()?.say?.(fileBox)

            await msg?.say(file)
            console.log({contact1: contact1?.say, text, requestImage2})
          } else if (data?.length){
            await msg.say(data?.[0]?.message?.content)
          } else {
            data = data.replace(/^？\n{1}/,'').replace(/^<br><br>/,'')
            await msg.say(data)
          }
        }
      } catch (e) {
        list[key] = false
      }
      list[key] = false
    }
  } else {
    list[key] = false
  }
}