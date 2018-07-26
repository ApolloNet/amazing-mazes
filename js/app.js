/**
 * Imports.
 */
import mazeFiles from './config.mazefiles.js'
import borders from './config.borders.js'
import encounters from './config.encounters.js'
import heroDefaultAttacks from './config.attacks.js'
import icons from './config.icons.js'
import {getRandomNumber, $, t} from './helpers.js'

/**
 * Game.
 */
const game = {
  status: 0,
  translations: {},
  init: () => {
    const mazeFile = game.getMazeFromURL()
    if (!mazeFile) {
      game.getRandomMaze()
    }
    game.initLoadForm()
    maze.load(mazeFile)
  },
  getRandomMaze: () => {
    const mazeFilesKeys = Object.keys(mazeFiles);
    const rand = getRandomNumber(mazeFilesKeys.length)
    const randomKey = mazeFilesKeys[rand]
    const maze = mazeFiles[randomKey]
    document.location += '?load=' + maze
  },
  getMazeFromURL: () => {
    const params = new URLSearchParams(document.location.search.substring(1))
    const mazeFile = params.get('load')
    return mazeFile
  },
  initLoadForm: () => {
    const form = $('#loadForm')
    const select = $('#loadSelect')
    const submit = $('#loadSubmit')
    // Translations.
    select.options[0].text = '- ' + t('Select a level') + ' -'
    loadSubmit.value = t('Load')
    // Load mazes in the select options.
    for (let Mazename in mazeFiles) {
      const option = document.createElement('option')
      const optionText = document.createTextNode(Mazename)
      option.setAttribute('value', mazeFiles[Mazename])
      option.appendChild(optionText)
      select.appendChild(option)
    }
    // Todo: if a maze is already loaded, display a confirm message.
    form.addEventListener('submit', () => {
      
    })
  },
  listenToKeyboard: () => {
    document.addEventListener('keydown', (e) => {
      if (game.status === 1) {
        hero.move(e.key)
      }
      if (game.status === 2 && e.keyCode === 32) {
        fight.play()
      }
    })
  },
  over: () => {
    if (hero.hp <= 0) {
      const body = $('body')
      game.status = 0
      body.classList.add('game-over')
      maze.updateCellDiv(maze.current.r, maze.current.c, 'lose')
      game.writeMessage(t('Game over'), 'red', '🕱')
      game.writeMessage('<a href="' + document.location + '">' + t('Try again?') + '</a>', '', '🗘')
    }
  },
  writeMessage: (message, color, icon) => {
    const messagesDiv = $('#messages')
    const messageDiv = document.createElement('div')
    messageDiv.innerHTML = '<div class="icon">' + (icon ? icon : '') + '</div>'
    messageDiv.innerHTML += '<div class="text">' + message + '</div>'
    messageDiv.classList.add('message')
    if (color) {
      messageDiv.classList.add(color)
    }
    messagesDiv.insertBefore(messageDiv, messagesDiv.childNodes[0])
  }
}

/**
 * Maze.
 */
const maze = {
  light: 0,
  cells: [],
  size: {},
  current: {
    r: 0,
    c: 0
  },
  load: (mazeFile) => {
    // d3-fetch lib is loaded via html script tag.
    d3.json('mazes/' + mazeFile).then((data) => {
      game.translations = data.translations
      maze.init(data)
      hero.init(data)
      game.listenToKeyboard()
      maze.isLoaded()
    }).catch(
      error => console.error(error.message)
    )
  },
  isLoaded: () => {
    const body = $('body')
    body.classList.toggle('waiting')
    game.status = 1
  },
  init: (data) => {
    maze.light = data.hasOwnProperty('light') ? data.light : 0
    maze.initTitle(data.name)
    maze.initCells(data)
    maze.initEvents(data)
    maze.drawCells()
    maze.updateMazeCSS()
    maze.switchLight()
  },
  initTitle: (name) => {
    const titleDiv = $('#maze-title')
    titleDiv.innerHTML = name
  },
  initCells: (data) => {
    let r = 0
    let c = 0
    data.cells.forEach((row) => {
      c = 0
      row.forEach(() => {
        maze.initCell(r, c, data)
        ++c
      })
      ++r
    })
    maze.size = {r, c}
  },
  initCell: (r, c, data) => {
    const cell = {
      'r': r,
      'c': c,
      'walls': data.cells[r][c],
      'seen': 0
    }
    maze.cells.push(cell)
  },
  initEvents: (data) => {
    data.events.forEach((event) => {
      const index = maze.getCellIndex(event.r, event.c)
      event.once = event.once === 0 ? 0 : 1
      if (!event.icon && icons[event.type]) {
        event.icon = icons[event.type]
      }
      maze.cells[index].event = event
      if (event.type === 'start') {
        action.init(event)
      }
    })
  },
  updateMazeCSS: () => {
    const mazeDiv = $('#maze')
    const cellWidth = 2.25
    const gutterWidth = 0.0625
    const cellBorderWidth = 0.0625
    const maxWidth = maze.size.c * (cellWidth + gutterWidth + cellBorderWidth)
    mazeDiv.style.gridTemplateRows = 'repeat(' + maze.size.r + ', minmax(' + cellWidth + 'rem, auto))'
    mazeDiv.style.gridTemplateColumns = 'repeat(' + maze.size.c + ', minmax(' + cellWidth + 'rem, auto))'
    mazeDiv.style.maxWidth = maxWidth + 'rem'
  },
  switchLight: () => {
    const mazeDiv = $('#maze')
    if (maze.light === 0) {
      mazeDiv.classList.add('dark')
      mazeDiv.classList.remove('light')
    }
    else {
      mazeDiv.classList.add('light')
      mazeDiv.classList.remove('dark')
    }
  },
  drawCells: () => {
    maze.cells.forEach((cell) => {
      const mazeDiv = $('#maze')
      const cellDiv = document.createElement('div')
      const icon = (cell.event && cell.event.icon) ? cell.event.icon : ''
      cellDiv.classList.add('cell')
      borders.map((border) => {
        if (maze.isThereAWall(cell.r, cell.c, border.shortname)) {
          cellDiv.classList.add('wall-' + border.shortname)
        }
      })
      if (cell.seen === 0) {
        cellDiv.classList.add('unseen')
      }
      cellDiv.setAttribute('data-r', cell.r)
      cellDiv.setAttribute('data-c', cell.c)
      cellDiv.setAttribute('data-icon', icon)
      mazeDiv.appendChild(cellDiv)
    })
  },
  getCell: (r, c) => {
    return maze.cells.filter(cell => {
      return (cell.r === r && cell.c === c)
    })[0]
  },
  getCellIndex: (r, c) => {
    let cellIndex = -1
    maze.cells.forEach((cell, index) => {
      if (cell.r === r && cell.c === c) {
        cellIndex = index
      }
    })
    return cellIndex
  },
  cellExists: (r, c) => {
    const cell = maze.getCell(r, c)
    return (cell !== null && typeof cell === 'object')
  },
  getCellWalls: (r, c) => {
    const cell = maze.getCell(r, c)
    const walls = cell.walls.split('')
    return walls
  },
  isThereAWall: (r, c, direction) => {
    const walls = maze.getCellWalls(r, c)
    return walls.includes(direction) || false
  },
  openTheDoor: (nextCell) => {
    const heroHasTheObject = hero.hasObject(nextCell.event.success.object)
    if (!heroHasTheObject) {
      game.writeMessage(t(nextCell.event.message, game.translations), '', nextCell.event.icon)
      return false
    }
    return true
  },
  updateCurrentCell: () => {
    maze.updateCurrentCellCSS()
    maze.updateSeenCell(maze.current.r, maze.current.c)
    if (hero.hasObject('torch')) {
      maze.updateNearbyCells(maze.current.r, maze.current.c)
    }
  },
  updateCurrentCellCSS: () => {
    const cellsDivs = document.querySelectorAll('.cell')
    const cellDiv = maze.getCellDiv(maze.current.r, maze.current.c)
    ;
    [].forEach.call(cellsDivs, (cellDiv) => {
      cellDiv.classList.remove('current')
      cellDiv.setAttribute('data-current', '')
    })
    cellDiv.classList.add('current')
    cellDiv.setAttribute('data-current', hero.icon)
  },
  updateSeenCell: (r, c) => {
    const cellDiv = maze.getCellDiv(r, c)
    maze.cells.forEach((cell, index) => {
      if (cell.r === r && cell.c === c) {
        maze.cells[index].seen = 1
      }
    })
    cellDiv.classList.remove('unseen')
  },
  updateNearbyCells: (r, c) => {
    borders.map((border) => {
      const nearbyCell = {
        r: (r + border.r),
        c: (c + border.c)
      }
      const exists = maze.cellExists(nearbyCell.r, nearbyCell.c)
      const isReachable = !(maze.isThereAWall(r, c, border.shortname))
      if (exists && isReachable) {
        maze.updateSeenCell(nearbyCell.r, nearbyCell.c)
      }
    })
  },
  getEventFromCell: (r, c) => {
    const cell = maze.getCell(r, c)
    return cell.event
  },
  removeEventFromCell: (r, c) => {
    maze.cells.forEach((cell, index) => {
      if (cell.r === r && cell.c === c) {
        const cellDiv = maze.getCellDiv(r, c)
        if (cellDiv) {
          cellDiv.setAttribute('data-icon', '')
        }
        maze.cells[index].event = null
      }
    })
  },
  updateCellDiv: (r, c, CssClass) => {
    const cellsDivs = document.querySelectorAll('.cell')
    const cellDiv = maze.getCellDiv(r, c)
    ;
    [].forEach.call(cellsDivs, (cellDiv)  => {
      cellDiv.classList.remove(CssClass)
    })
    cellDiv.classList.add(CssClass)
  },
  getCellDiv: (r, c) => {
    return $('.cell[data-r="' + r + '"][data-c="' + c + '"]')
  },
  setCurrent: (r, c) => {
    maze.current.r = r
    maze.current.c = c
  },
  setCurrentFromDirection: (direction) => {
    maze.current.r += direction.r
    maze.current.c += direction.c
    maze.updateCurrentCell()
  },
  getNextCell: (direction) => {
    const nextCellR = maze.current.r + direction.r
    const nextCellC = maze.current.c + direction.c
    const nextCell = maze.getCell(nextCellR, nextCellC)
    return nextCell
  }
}

/**
 * Hero.
 */
const hero = {
  name: 'Frodorik',
  icon: '🤺',
  hp: 0,
  attacks: [],
  objects: [],
  direction: 'right',
  init: (data) => {
    hero.initNameAndIcon(data)
    hero.initAttacks(data)
    action.metrix({
      'metrix': 'hp',
      'effect': 'earn',
      'points': data.hero.hp
    })
    maze.updateCurrentCell()
  },
  initNameAndIcon: (data) => {
    const iconDiv = $('#hero-icon')
    const nameDiv = $('#hero-name')
    hero.name = data.hero.name ? data.hero.name : hero.name
    hero.icon = data.hero.icon ? data.hero.icon : hero.icon
    iconDiv.innerHTML = hero.icon
    nameDiv.innerHTML = hero.name
  },
  initAttacks: (data) => {
    hero.attacks = data.hero.attacks ? data.hero.attacks : heroDefaultAttacks
  },
  updateMetrixDiv: (metrix) => {
    const metrixDiv = $('#hero-' + metrix)
    metrixDiv.innerHTML = hero[metrix]
  },
  updateCharacterDiv: (effect) => {
    const heroDiv = $('#hero')
    heroDiv.classList.add('character-' + effect)
    window.setTimeout(() => {
      heroDiv.classList.remove('character-' + effect)
    }, 500)
    
  },
  move: (key) => {
    const direction = hero.getDirectionFromKey(key)
    if (!direction) {
      return
    }
    const thereIsAWall = maze.isThereAWall(maze.current.r, maze.current.c, direction.shortname)
    if (thereIsAWall) {
      hero.rotate(direction.name)
      hero.hitAWall()
      return
    }
    const nextCell = maze.getNextCell(direction)
    const thereIsADoor = (nextCell.event && nextCell.event.type === 'protected')
    if (thereIsADoor) {
      const doorIsOpen = maze.openTheDoor(nextCell)
      if (!doorIsOpen) {
        return
      }
    }
    maze.setCurrentFromDirection(direction)
    const event = maze.getEventFromCell(maze.current.r, maze.current.c)
    action.init(event)
    maze.updateCurrentCell(maze.current.r, maze.current.c)
    hero.rotate(direction.name)
    game.over()
  },
  rotate: (directionName) => {
    const currentCellDiv = $('.current')
    if (directionName === 'left' || directionName === 'right') {
      hero.direction = directionName
    }
    if (hero.direction === 'left') {
      currentCellDiv.classList.add('direction-left')
    }
    if (hero.direction === 'right') {
      currentCellDiv.classList.remove('direction-left')
    }
  },
  encounter: () => {
    const cell = maze.getCell(maze.current.r, maze.current.c)
    if (cell.event) {
      return
    }
    const random = getRandomNumber(60)
    if (!encounters[random]) {
      return
    }
    const encounter = encounters[random]
    action.metrix({
      'metrix': encounter.metrix,
      'effect': 'lose',
      'points': encounter.points,
      'message': t(encounter.message),
      'icon': encounter.icon
    })
  },
  hitAWall: () => {
    const random = getRandomNumber(10)
    if (random != 1) {
      return
    }
    action.metrix({
      'metrix': 'hp',
      'effect': 'lose',
      'points': 1,
      'message': t('You hit a wall'),
      'icon': '💥'
    })
  },
  getDirectionFromKey: (key) => {
    const directions = borders.filter((border) => {
      return border.key === key
    })
    if (!directions[0]) {
      return
    }
    return directions[0]
  },
  hasObject: (object) => {
    return hero.objects.includes(object)
  }
}

/**
 * Action.
 */
const action = {
  init: (event) => {
    // No event : random encounter, and return.
    if (!event || !event.type) {
      hero.encounter()
      return
    }
    // Execute.
    if (action[event.type]) {
      action[event.type](event)
    }
    // Event happens once.
    if (event.once === 1) {
      maze.removeEventFromCell(event.r, event.c)
    }
  },
  fight: (event) => {
    fight.init(event)
  },
  learn: (event) => {
    hero.attacks.push(event.attack)
    hero.updateCharacterDiv('earn')
    const message = t(event.message, game.translations) + '<br><em>' + event.attack.name + '</em> : ' + event.attack.hp + ' HP'
    game.writeMessage(message, '', event.icon)
  },
  light: () => {
    maze.light = maze.light === 0 ? 1 : 0
    const onoff = (maze.light === 0) ? 'off' : 'on'
    maze.switchLight()
    game.writeMessage(t('You switched ' + onoff + ' the lights'), '', icons.light)
  },
  message: (event) => {
    game.writeMessage(t(event.message, game.translations), '', event.icon)
  },
  metrix: (event) => {
    const points = parseInt(event.points)
    hero[event.metrix] = (event.effect === 'earn') ? (hero[event.metrix] + points) : (hero[event.metrix] - points)
    if (hero[event.metrix] < 0 ) {
      hero[event.metrix] = 0
    }
    hero.updateCharacterDiv(event.effect)
    hero.updateMetrixDiv(event.metrix)
    if (!event.message) {
      return
    }
    const message = t(event.message, game.translations) + '<br> ' + t('you ' + event.effect) + ' ' + event.points + ' '+ event.metrix
    const messageColor = (event.effect === 'lose') ? 'red' : ''
    game.writeMessage(message, messageColor, event.icon)
  },
  move: (event) => {
    maze.setCurrent(event.to.r, event.to.c)
    maze.updateCurrentCell()
    game.writeMessage(t(event.message, game.translations), '', event.icon)
  },
  object: (event) => {
    hero.objects.push(event.object)
    game.writeMessage(t(event.message, game.translations), '', event.icon)
  },
  protected: (event) => {
    game.writeMessage(t(event.success.message, game.translations), '', event.success.icon)
  },
  reveal: (event) => {
    event.cells.forEach((cell) => {
      maze.updateSeenCell(cell.r, cell.c)
    })
    game.writeMessage(t(event.message, game.translations), '', event.icon)
  },
  start: (event) => {
    maze.setCurrent(event.r, event.c)
    game.writeMessage(t(event.message, game.translations), '', event.icon)
    game.writeMessage('<kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> <kbd>←</kbd> ' + t('to move'), '', '⌨')
  },
  win: (event) => {
    game.status = 0
    maze.updateCellDiv(event.r, event.c, 'win')
    hero.updateCharacterDiv('earn')
    game.writeMessage(t(event.message, game.translations), 'green', event.icon)
    game.writeMessage('<a href="' + document.location + '">' + t('Replay?') + '</a>', '', '🗘')
  },
}

/**
 * Fight.
 */
const fight = {
  whoplays: 'hero',
  opponent: '',
  icon: '',
  hp: '',
  attacks: [],
  init: (event) => {
    game.status = 2
    game.writeMessage(t(event.message, game.translations), '', event.icon)
    game.writeMessage(t('Fight mode on') + '<br>' + t('You must defeat') + ' ' + event.opponent, 'red', '💥')
    game.writeMessage(t('Press <kbd>Space bar</kbd> to fight'), '', '⌨')
    fight.changeBodyClass()
    fight.initData(event)
    fight.initMarkup()
  },
  initData: (event) => {
    // TODO: There sure is a gracious way to do that.
    fight.whoplays = event.whoplays ? event.whoplays : fight.whoplays
    fight.opponent = event.opponent
    fight.icon = event.icon
    fight.hp = event.hp
    fight.attacks = event.attacks
    fight.rewards = event.rewards
  },
  changeBodyClass: () => {
    const body = $('body')
    if (game.status === 2) {
      body.classList.add('fight-mode')
    }
    else {
      body.classList.remove('fight-mode')
    }
  },
  initMarkup: () => {
    const heroName = $('#fight-hero-name')
    const heroIcon = $('#fight-hero-icon')
    const heroHp = $('#fight-hero-hp')
    const opponentName = $('#fight-opponent-name')
    const opponentIcon = $('#fight-opponent-icon')
    const opponentHp = $('#fight-opponent-hp')
    heroName.innerHTML = hero.name
    heroIcon.innerHTML = hero.icon
    heroHp.innerHTML = hero.hp
    opponentName.innerHTML = fight.opponent
    opponentIcon.innerHTML = fight.icon
    opponentHp.innerHTML = fight.hp
  },
  play: () => {
    if (fight.whoplays === 'hero') {
      fight.heroAttacks()
    }
    if (fight.whoplays === 'opponent') {
      fight.opponentAttacks()
    }
    fight.next()
  },
  heroAttacks: () => {
    const opponentHp = $('#fight-opponent-hp')
    const attackNumber = getRandomNumber(hero.attacks.length)
    const attack = hero.attacks[attackNumber]
    const message = '<em>' + t(attack.name, game.translations) + '</em><br>' + fight.opponent + ' ' + t('loses') + ' ' + attack.hp + ' HP'
    const icon = attack.icon ? attack.icon : hero.icon
    fight.hp -= attack.hp
    if (fight.hp < 0) {
      fight.hp = 0
    }
    opponentHp.innerHTML = fight.hp
    game.writeMessage(message, '', icon)
  },
  opponentAttacks: () => {
    const heroHp = $('#fight-hero-hp')
    const attackNumber = getRandomNumber(fight.attacks.length)
    const attack = fight.attacks[attackNumber]
    const message = '<em>' + t(attack.name, game.translations) + '</em><br>' + t('you lose') + ' ' + attack.hp + ' HP'
    const icon = attack.icon ? attack.icon : fight.icon
    action.metrix({
      'metrix': 'hp',
      'effect': 'lose',
      'points': attack.hp
    })
    heroHp.innerHTML = hero.hp
    game.writeMessage(message, '', icon)
  },
  next: () => {
    if (hero.hp <= 0) {
      game.over()
      return
    }
    if (fight.hp <= 0) {
      fight.win()
      return
    }
    fight.whoplays = (fight.whoplays === 'hero') ? 'opponent' : 'hero'
  },
  win: () => {
    game.status = 1
    game.writeMessage(t('You defeated') + ' ' + fight.opponent, 'red', '✌')
    fight.changeBodyClass()
    if (!fight.rewards) {
      return
    }
    fight.rewards.forEach((reward) => {
      action.init(reward)
    })
  }
}

/**
 * Init.
 */
game.init()