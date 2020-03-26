const WebSocket = require('ws')

const serverCommands = {
  // 检查id是否存在，可用于注册id以及搜索id
  existId: 'existId',
  // 注册id
  registerId: 'registerId',
  // 等待对手
  waitOpponent: 'waitOpponent',
  // 寻找对手
  findOpponent: 'findOpponent',
  // 开始游戏
  startGame: 'startGame',
  // 确认下一步
  confirmNextStep: 'confirmNextStep',
}

const clientCommands = {
  // 检查id结果
  existResult: 'existResult',
  // 开始游戏通知
  startNotice: 'startNotice',
  // 开始下棋
  startNextStep: 'startNextStep',
  // 游戏结束
  endGame: 'endGame',
}

const userWs = []

function toClient(command, payload) {
  return JSON.stringify({
    command,
    payload,
  })
}

function parseUrlQuery(url) {
  const queryString = url.split('?')[1]
  const query = {}
  queryString.split('&').forEach(paramItem => {
    const [key, value] = paramItem.split('=')
    query[key] = value
  })
  return query
}

function init() {
  const WebSocketServer = WebSocket.Server
  const wss = new WebSocketServer({
    port: 11220,
  })
  wss.on('connection', (ws, request) => {
    const query = parseUrlQuery(request.url)
    ws.on('message', message => {
      const wsData = JSON.parse(message)
      executeCommand(wsData.command, wsData.payload, ws, query.rid)
      // ws.send(`ECHO: ${message}`, err => {
      //   if (err) {
      //     console.log(`[SERVER] error: ${err}`)
      //   }
      // })
    })

    ws.on('close', () => {
      // 删除
      const index = userWs.findIndex(item => item.rid === query.rid)
      userWs.splice(index, 1)
    })
  })
}

function executeCommand(command, payload, ws, rid) {
  switch (command) {
    case serverCommands.existId:
      checkUserId(payload.userId, ws)
      break
    case serverCommands.registerId:
      userWs.push({
        userId: payload.userId,
        ws,
        rid,
      })
      break
    case serverCommands.startGame:
      startGame(payload)
      break
    case serverCommands.confirmNextStep:
      confirmNextStep(payload)
      break
  }
}

function checkUserId(id, ws) {
  const exist = !!userWs.find(item => item.userId === id)
  ws.send(toClient(clientCommands.existResult, { userId: id, exist }))
}

function startGame(payload) {
  const white = userWs.find(item => item.userId === payload.w)
  const black = userWs.find(item => item.userId === payload.b)
  if (white && black) {
    const whiteWs = white.ws
    const blackWs = black.ws
    whiteWs.send(toClient(clientCommands.startNotice, payload))
    blackWs.send(toClient(clientCommands.startNotice, payload))
    if (payload.first === 'w') {
      whiteWs.send(toClient(clientCommands.startNextStep, null))
    } else {
      blackWs.send(toClient(clientCommands.startNextStep, null))
    }
  }
}

function confirmNextStep(payload) {
  const nextRole = payload.role === 'w' ? 'b' : 'w'
  const user = userWs.find(item => item.userId === payload[nextRole])
  if (user) {
    user.ws.send(toClient(clientCommands.startNextStep, payload))
  }
}

// 执行
init()
