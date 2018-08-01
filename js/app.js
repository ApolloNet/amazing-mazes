/**
 * Imports.
 */
import mazeFiles from './config.mazefiles.js'
import borders from './config.borders.js'
import encounters from './config.encounters.js'
import defaultAttacks from './config.attacks.js'
import icons from './config.icons.js'
import {getRandomNumber, $, t, isTouch} from './helpers.js'

/**
 * Game.
 */
const game = {
  status: 0,
  translations: {},
  init: () => {
    const mazeFile = game.loadMazeFromURL()
    if (!mazeFile) {
      game.loadRandomMaze()
      return
    }
    game.toggleNavigation()
    game.initMazesList()
    maze.load(mazeFile)
  },
  loadMazeFromURL: () => {
    if (!document.location.search) {
      return
    }
    const params = new URLSearchParams(document.location.search.substring(1))
    const mazeFile = params.get('load')
    return mazeFile + '.json'
  },
  loadRandomMaze: () => {
    const mazeFilesKeys = Object.keys(mazeFiles);
    const rand = getRandomNumber(mazeFilesKeys.length)
    document.location.search = 'load=' + mazeFilesKeys[rand]
  },
  initMazesList: () => {
    const $listOpen = $('#mazes-list--open')
    const $listClose = $('#mazes-list--close')
    const $mazesList = $('#mazes-list ul')
    for (let machineName in mazeFiles) {
      const mazeData = mazeFiles[machineName]
      $mazesList.innerHTML += `<li><a href="?load=${machineName}">
        <span>${mazeData.icon}</span>
        <span class="mazes-list--name">${mazeData.name}</span>
        <span class="description">${mazeData.size}</span>
        </a></li>`
    }
    $listOpen.addEventListener('click', () => {
      document.location.hash = 'mazes-list'
    })
    $listClose.addEventListener('click', () => {
      document.location.hash = ''
    })
  },
  listenToKeyboard: () => {
    document.addEventListener('keydown', (e) => {
      hero.move(e.key)
      if (e.keyCode === 32) {
        fight.heroAttacks()
      }
    })
  },
  listenToFakeKeyboard: () => {
    const $arrows = document.querySelectorAll('.keyboard--arrow')
    const $action = $('.keyboard--key--action')
    // Arrows.
    ;
    [].forEach.call($arrows, (key) => {
      key.addEventListener('click', () => {
        const keyId = key.getAttribute('data-key')
        hero.move(keyId)
      })
    })
    // Action.
    $action.addEventListener('click', () => {
      fight.heroAttacks()
    })
  },
  help: () => {
    const $help = $('#help')
    const message = '<kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> <kbd>←</kbd> ' + t('to move')
      + '<br>' + t('<kbd>Space bar</kbd> to fight')
    $help.addEventListener('click', () => {
      game.writeMessage('❔', message)
    })
  },
  toggleNavigation: () => {
    const $header = $('#main-header')
    const $button = $('#navigation-toogle')
    $button.addEventListener('click', () => {
      $header.classList.toggle('hidden')
    })
  },
  hpPercent: ($element, hp) => {
    const hpInit = $element.getAttribute('data-hp-init')
    const percent = hp * 100 / hpInit
    const correctedPercent = (percent <= 100) ? percent : 100
    $element.style.width = correctedPercent + '%'
  },
  over: () => {
    if (hero.hp <= 0) {
      const $body = $('body')
      const message = t('Game over') + '<br><a href="' + document.location + '">' + t('Try again?') + '</a>'
      game.status = 0
      $body.classList.add('game-over')
      maze.updateCellDiv(maze.current.r, maze.current.c, 'lose')
      game.writeMessage('🕱', message, 'red')
    }
  },
  writeMessage: (icon, message, color) => {
    const $messages = $('#messages')
    const $message = document.createElement('div')
    $message.innerHTML = '<div class="icon">' + (icon ? icon : '') + '</div>'
    $message.innerHTML += '<div class="text">' + message + '</div>'
    $message.classList.add('message')
    if (color) {
      $message.classList.add(color)
    }
    $messages.insertBefore($message, $messages.childNodes[0])
  }
}

/**
 * Maze.
 */
const maze = {
  light: 0,
  authors: '',
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
      game.listenToFakeKeyboard()
      maze.isLoaded()
    }).catch(
      error => console.error(error.message)
    )
  },
  isLoaded: () => {
    const $body = $('body')
    const $header = $('#main-header')
    if (isTouch()) {
      $body.classList.add('touch')
      $header.classList.add('hidden')
    }
    $body.classList.toggle('waiting')
    game.status = 1
  },
  init: (data) => {
    maze.light = data.hasOwnProperty('light') ? data.light : 0
    maze.initTitle(data.name)
    maze.displayAuthors(data.authors)
    maze.initCells(data)
    maze.initEvents(data)
    maze.drawCells()
    maze.updateMazeCSS()
    maze.switchLight()
  },
  initTitle: (name) => {
    const $title = $('#maze-title')
    $title.innerHTML = name
  },
  displayAuthors: (authors) => {
    if (authors) {
      const message = t('This maze was created by') + '<br>' + authors
      game.writeMessage('✍', message)
    }
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
      event.visible = event.visible === 0 ? 0 : 1
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
    const $maze = $('#maze')
    const cellWidth = 2.25
    const gutterWidth = 0.0625
    const cellBorderWidth = 0.0625
    const maxWidth = maze.size.c * (cellWidth + gutterWidth + cellBorderWidth)
    $maze.style.gridTemplateRows = 'repeat(' + maze.size.r + ', minmax(' + cellWidth + 'rem, auto))'
    $maze.style.gridTemplateColumns = 'repeat(' + maze.size.c + ', minmax(' + cellWidth + 'rem, auto))'
    $maze.style.maxWidth = maxWidth + 'rem'
  },
  drawCells: () => {
    maze.cells.forEach((cell) => {
      const $maze = $('#maze')
      const $cell = document.createElement('div')
      const icon = (cell.event && cell.event.icon && cell.event.visible) ? cell.event.icon : ''
      $cell.classList.add('cell')
      borders.map((border) => {
        if (maze.isThereAWall(cell.r, cell.c, border.shortname)) {
          $cell.classList.add('wall-' + border.shortname)
        }
      })
      if (cell.seen === 0) {
        $cell.classList.add('unseen')
      }
      $cell.setAttribute('data-r', cell.r)
      $cell.setAttribute('data-c', cell.c)
      $cell.setAttribute('data-icon', icon)
      $maze.appendChild($cell)
    })
  },
  switchLight: () => {
    const $maze = $('#maze')
    if (maze.light === 0) {
      $maze.classList.add('dark')
      $maze.classList.remove('light')
    }
    else {
      $maze.classList.add('light')
      $maze.classList.remove('dark')
    }
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
      game.writeMessage(nextCell.event.icon, t(nextCell.event.message, game.translations))
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
    const $cells = document.querySelectorAll('.cell')
    const $currentCell = maze.getCellDiv(maze.current.r, maze.current.c)
    ;
    [].forEach.call($cells, ($cell) => {
      $cell.classList.remove('current')
      $cell.setAttribute('data-current', '')
    })
    $currentCell.classList.add('current')
    $currentCell.setAttribute('data-current', hero.icon)
  },
  updateSeenCell: (r, c) => {
    const $cell = maze.getCellDiv(r, c)
    maze.cells.forEach((cell, index) => {
      if (cell.r === r && cell.c === c) {
        maze.cells[index].seen = 1
      }
    })
    $cell.classList.remove('unseen')
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
        const $cell = maze.getCellDiv(r, c)
        if ($cell) {
          $cell.setAttribute('data-icon', '')
        }
        maze.cells[index].event = null
      }
    })
  },
  updateCellDiv: (r, c, CssClass) => {
    const $cells = document.querySelectorAll('.cell')
    const $currentCell = maze.getCellDiv(r, c)
    ;
    [].forEach.call($cells, ($cell)  => {
      $cell.classList.remove(CssClass)
    })
    $currentCell.classList.add(CssClass)
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
  hp: 100,
  attacks: [],
  objects: [],
  direction: 'right',
  init: (data) => {
    const $name = $('#hero-name')
    const $icon = $('#hero-icon')
    const $hp = $('#hero-hp')
    const $hpBar = $('#hero-hp-bar')
    hero.name = (data.hero && data.hero.name) ? data.hero.name : hero.name
    hero.icon = (data.hero && data.hero.icon) ? data.hero.icon : hero.icon
    hero.hp = (data.hero && data.hero.hp) ? data.hero.hp : hero.hp
    hero.attacks = (data.hero && data.hero.attacks) ? data.hero.attacks : defaultAttacks
    $name.innerHTML = hero.name
    $icon.innerHTML = hero.icon
    $hp.innerHTML = hero.hp
    $hpBar.setAttribute('data-hp-init', hero.hp)
    maze.updateCurrentCell()
  },
  update: () => {
    const $hpBar = $('#hero-hp-bar')
    game.hpPercent($hpBar, hero.hp)
  },
  updateMetrixDiv: (metrix) => {
    const metrixDiv = $('#hero-' + metrix)
    metrixDiv.innerHTML = hero[metrix]
  },
  updateCharacterDiv: (effect) => {
    const $hero = $('#hero')
    $hero.classList.add('character-' + effect)
    window.setTimeout(() => {
      $hero.classList.remove('character-' + effect)
    }, 500)
    
  },
  move: (key) => {
    if (game.status !== 1) {
      return
    }
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
    const $currentCell = $('.current')
    if (directionName === 'left' || directionName === 'right') {
      hero.direction = directionName
    }
    if (hero.direction === 'left') {
      $currentCell.classList.add('direction-left')
    }
    if (hero.direction === 'right') {
      $currentCell.classList.remove('direction-left')
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
    game.writeMessage(event.icon, message)
  },
  light: () => {
    maze.light = maze.light === 0 ? 1 : 0
    const onoff = (maze.light === 0) ? 'off' : 'on'
    maze.switchLight()
    game.writeMessage(icons.light, t('You switched ' + onoff + ' the lights'))
  },
  message: (event) => {
    game.writeMessage(event.icon, t(event.message, game.translations))
  },
  metrix: (event) => {
    const points = parseInt(event.points)
    hero[event.metrix] = (event.effect === 'earn') ? (hero[event.metrix] + points) : (hero[event.metrix] - points)
    if (hero[event.metrix] < 0 ) {
      hero[event.metrix] = 0
    }
    hero.update()
    hero.updateCharacterDiv(event.effect)
    hero.updateMetrixDiv(event.metrix)
    if (!event.message) {
      return
    }
    const message = t(event.message, game.translations) + '<br> ' + t('you ' + event.effect) + ' ' + event.points + ' '+ event.metrix
    const messageColor = (event.effect === 'lose') ? 'red' : ''
    game.writeMessage(event.icon, message, messageColor)
  },
  move: (event) => {
    maze.setCurrent(event.to.r, event.to.c)
    maze.updateCurrentCell()
    game.writeMessage(event.icon, t(event.message, game.translations))
  },
  mutate: (event) => {
    hero.update(event.hero)
    game.writeMessage(event.icon, t(event.message, game.translations), 'yellow')
  },
  object: (event) => {
    hero.objects.push(event.object)
    game.writeMessage(event.icon, t(event.message, game.translations))
  },
  protected: (event) => {
    game.writeMessage(event.success.icon, t(event.success.message, game.translations))
  },
  reveal: (event) => {
    event.cells.forEach((cell) => {
      maze.updateSeenCell(cell.r, cell.c)
    })
    game.writeMessage(event.icon, t(event.message, game.translations))
  },
  start: (event) => {
    const help = $('#help')
    maze.setCurrent(event.r, event.c)
    game.help()
    help.click()
    game.writeMessage(event.icon, t(event.message, game.translations))
  },
  win: (event) => {
    const message = t(event.message, game.translations)
      + '<br><a href="' + document.location + '">' + t('Replay?') + '</a>'
    game.status = 0
    maze.updateCellDiv(maze.current.r, maze.current.c, 'win')
    hero.updateCharacterDiv('earn')
    game.writeMessage(event.icon, message, 'green')
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
    game.writeMessage(event.icon, t(event.message, game.translations))
    fight.changeBodyClass()
    fight.initData(event)
    fight.initMarkup()
    fight.opponentAttacks()
  },
  initData: (event) => {
    // TODO: There sure is a gracious way to do that.
    fight.whoplays = event.whoplays ? event.whoplays : fight.whoplays
    fight.opponent = event.opponent
    fight.icon = event.icon
    fight.hp = event.hp
    fight.attacks = event.attacks ? event.attacks : defaultAttacks
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
    const $heroName = $('#fight-hero-name')
    const $heroIcon = $('#fight-hero-icon')
    const $heroHp = $('#fight-hero-hp')
    const $heroBar = $('#fight-hero-hp-bar')
    const $opponentName = $('#fight-opponent-name')
    const $opponentIcon = $('#fight-opponent-icon')
    const $opponentHp = $('#fight-opponent-hp')
    const $opponentBar = $('#fight-opponent-hp-bar')
    $heroName.innerHTML = hero.name
    $heroIcon.innerHTML = hero.icon
    $heroHp.innerHTML = hero.hp
    $heroBar.setAttribute('data-hp-init', hero.hp)
    $opponentName.innerHTML = fight.opponent
    $opponentIcon.innerHTML = fight.icon
    $opponentHp.innerHTML = fight.hp
    $opponentBar.setAttribute('data-hp-init', fight.hp)
    fight.updateMarkup()
    fight.updateHpBars()
  },
  updateMarkup: () => {
    const $hero = $('#fight-hero')
    const $opponent = $('#fight-opponent')
    if (fight.whoplays === 'hero') {
      $hero.classList.add('fight-current')
      $opponent.classList.remove('fight-current')
    }
    if (fight.whoplays === 'opponent') {
      $opponent.classList.add('fight-current')
      $hero.classList.remove('fight-current')
    }
  },
  updateHpBars: () => {
    const $hpBar = $('#hero-hp-bar')
    const $heroBar = $('#fight-hero-hp-bar')
    const $opponentBar = $('#fight-opponent-hp-bar')
    game.hpPercent($hpBar, hero.hp)
    game.hpPercent($heroBar, hero.hp)
    game.hpPercent($opponentBar, fight.hp)
  },
  heroAttacks: () => {
    if (game.status !== 2 || fight.whoplays !== 'hero') {
      return
    }
    const $opponentHp = $('#fight-opponent-hp')
    const attackNumber = getRandomNumber(hero.attacks.length)
    const attack = hero.attacks[attackNumber]
    const message = '<em>' + t(attack.name, game.translations) + '</em><br>' + fight.opponent + ' ' + t('loses') + ' ' + attack.hp + ' HP'
    const icon = attack.icon ? attack.icon : hero.icon
    fight.hp -= attack.hp
    if (fight.hp < 0) {
      fight.hp = 0
    }
    $opponentHp.innerHTML = fight.hp
    fight.updateHpBars()
    game.writeMessage(icon, message)
    if (fight.hp <= 0) {
      fight.win()
      return
    }
    fight.whoplays = 'opponent'
    fight.updateMarkup()
    fight.opponentAttacksAuto()
  },
  opponentAttacks: () => {
    if (game.status !== 2 || fight.whoplays !== 'opponent') {
      return
    }
    const $heroHp = $('#fight-hero-hp')
    const attackNumber = getRandomNumber(fight.attacks.length)
    const attack = fight.attacks[attackNumber]
    const message = '<em>' + t(attack.name, game.translations) + '</em><br>' + t('you lose') + ' ' + attack.hp + ' HP'
    const icon = attack.icon ? attack.icon : fight.icon
    action.metrix({
      'metrix': 'hp',
      'effect': 'lose',
      'points': attack.hp
    })
    $heroHp.innerHTML = hero.hp
    fight.updateHpBars()
    game.writeMessage(icon, message)
    if (hero.hp <= 0) {
      game.over()
      return
    }
    fight.whoplays = 'hero'
    fight.updateMarkup()
  },
  opponentAttacksAuto: () => {
    if (fight.whoplays !== 'opponent') {
      return
    }
    const delay = 1000
    window.setTimeout(fight.opponentAttacks, delay)
  },
  win: () => {
    game.status = 1
    game.writeMessage('✌', t('You defeated') + ' ' + fight.opponent, 'red')
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