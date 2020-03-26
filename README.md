# 五子棋
一个网页版五子棋，支持联机对战。

采用Javascript进行服务端与客户端的开发。

## 服务端
Node.js + ws模块

主要用于存放用户信息以及使用websocket转发用户对战信息。

### websocket
**客户端->服务端**的数据格式
| 字段 | 类型 | 说明 |
| ------------ | ------------ | ------------ |
| userId | string | 用户id |
| command | string | 指令，详见下文 |
| payload | any | 载荷 |

**服务端->客户端**的数据格式
| 字段 | 类型 | 说明 |
| ------------ | ------------ | ------------ |
| command | string | 指令，详见下文 |
| payload | any | 载荷 |



## 客户端
原生Html + Javascript + Css

用户界面以及数据存储。

## 联机流程
用户注册id，指令:existId, registerId
选择操作：1.等待对手 2.寻找对手
1. 指令:waitOpponent
1-1 等待特定对手，payload中的special为true
1-2 等待随机对手，payload中的special为false

2. 指令:findOpponent
2-1 寻找特定对手，payload中的target为指定对手id
2-2 寻找随机对手，payload中的target为null

先进的是白（w），后进的是黑（b）
后进入游戏的用户触发开始棋局，指令:startGame
payload {
    first: string // 值为w或b，表明黑白方哪个先手，由客户端进行计算
    w: string // 白方id
    b: string // 黑方id
}

客户端在未收到服务端的开始下棋指令前，都处于等待状态

服务端收到开始指令后，向双方发送开始游戏通知指令：startNotice，表明游戏已开始
payload {
    first: string // 值为w或b，表明黑白方哪个先手，由客户端进行计算
    w: string // 白方id
    b: string // 黑方id
}
并向先手方发送开始下棋指令：startNextStep
payload: any // 上一步的payload，如果是第一步则为null 

目标客户端收到服务端传来的开始下棋指令后，
根据payload.previous绘制对手的棋子，并判断游戏是否结束，
并可以点击棋盘进行下棋,指令：confirmNextStep
payload {
    role: string // 值为w或b，表明谁下的棋
    x: number // 棋子的横坐标
    y: number // 棋子的纵坐标
    win: boolean // 是否胜出，由下棋方根据下的棋子的坐标进行计算
}
如果当前方已胜出，则在当前方结束游戏

服务端收到客户端传来的确认下一步指令后，向另一方发送开始下棋指令：startNextStep
payload: any // 客户端传来的确认下一步指令的payload


如果游戏结束，胜利方选择继续游戏，则按先进入游戏的流程走，指令:waitOpponent
payload {
    special: true
}
如果败方也选择继续游戏，则按后进入游戏的流程走，指令:findOpponent
payload {
    target: string // 对手的id
}
即胜利方重置身份为白(w)，败方重置身份为黑(b)，

