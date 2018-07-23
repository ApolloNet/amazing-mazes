# Amazing Mazes

Amazing mazes is little game engine created just for fun.

Play at [https://apollonet.github.io/amazing-mazes/](https://apollonet.github.io/amazing-mazes/)


# Create a new maze

✎ First, grab a pencil and an eraser and draw your maze on [graph paper](https://en.wikipedia.org/wiki/Graph_paper).

Then, have a look at the /mazes directory for examples.

## The Json file

A maze is defined in Json format, with these settings:

`name` (string, required): name of the maze

`light` (int, optional):

- "0": light off the entire maze (default)
- "1": light on the entire maze

`hero` (object, optional): See below for detailed informations

`cells` (array, required): cells of the maze. See below for detailed informations

`events` (array, required): events attached to cells. See below for detailed informations


# Icons

You can find unicode icons at [https://unicode-table.com/](https://unicode-table.com/), for instance.

Simply copy / paste. It's just text.


# Hero

The hero is defined with the following params.

Each one has defaults. Just add the ones you want to override in your json maze file.

`name` (string, optional, default: "Frodorik"): name of the hero

`icon` (string, optional, default: 🤺): a unicode icon that represents the hero

`hp` (int, optional, default: 0): number of health points at start

`strength` (int, optional, default: 0): number of strength point at start

`attacks` (array, optional): attacks used in fights

## Attacks

Attacks is an array of objects. Each one contains :

`name` (string, required): name of the attack

`hp` (int, required): hp damages

`icon` (string, optional, default: hero icon): icon of the attack

Defaults are stored in the /js/config.attacks.js file


# Cells

`cells` is an array of arrays. Each sub-array is a **row**. In each row, each item is a **cell**, defined by a string. That string defines the walls of the cell. It can only contain four letters:

- `t` for Top
- `r` for Right
- `b` for Bottom
- `l` for Left

For instance, a cell with `tbl` will have walls at its top, bottom and left sides.

And here is a little maze that has 3 rows and 3 columns:

```
"cells": [
    ["tl", "tb", "tr"],
    ["rl", "trl", "rl"],
    ["bl", "rb", "rbl"]
  ],
```


# Events

Each event will be attached to a cell. It is used for different purposes.
It is defined like this:

`r` (int, required): row of the cell the event will be attached to.

`c` (int, required): column of the cell will be attached to. Starts at zero too.

For rows and columns, we start counting at zero. It is real computer programming here ;-)

`type` (string, required): see below for detailed informations

`message` (string, required): the message displayed when the hero comes to that event's cell. HTML markup libe `<br>` can be used here.

`icon` (string, optional): a unicode icon displayed when the hero comes to that event's cell.

`once` (int, optional, default: "1"):

- "0": the event occurs each time the hero comes to that event's cell
- "1": the event occurs only one time

## Event types

`start`: defines where the game starts

`win`: defines where the game ends

`fight`: fight an opponent

`learn`: learn an attack

`light`: switches the lights of the entire maze on or off

`message`: display a message

`metrix`: changes a metrix value (hp, strength...). See details below.

`move`: moves the hero to another cell

`object`: adds an object to the hero's objects

`protected`: the hero can only come on this cell if he has got the appropriate object

`reveal`: switches the lights on of the some cells

## Required events

Only `start` and `win` events are mandatory to create a simple maze game.


# Start event

The start event is used on the cell where the game starts.

## Example

```
"r": 3,
"c": 4,
"type": "start",
"message": "Find the hidden treasure"
```

The game starts at the cell at the 4th row, 5th column.

The message "Find the hidden treasure" is displayed along with the default icon.


# Win event

The win event is used on the cell where the game is won.

## Example

```
"r": 8,
"c": 13,
"type": "win",
"message": "You found the hidden treasure",
"icon": "👑"
```

The game is won when the hero arrives at the cell at the 9th row, 14th column.

The message "👑 You found the hidden treasure" is displayed.

The game is over: play again or choose another maze...


# Fight event

Well, this is not just a maze game.

## Params

`opponent` (string, required): name of the opponent

`icon` (string, required): icon of the opponent

`hp` (int, required): health points of the opponent

`whoplays` (string, optional, default: "hero"): who attack first, "opponent" or "hero"

`attacks` (array, required): attacks of the opponent

`rewards` (array, optional): events triggered when the opponent is defeated

## Attacks

Each attack is an object defined with:

`name` (string, required): name of the attack

`hp` (int, required): number of health points inflicted

`icon` (string, optional, default: opponent icon): icon of the attack

## Rewards

Each reward is an event object: `metrix`, `object`, or whatever you want to happen when the opponent is defeated.

Reward events don't need `r`, `c` and `once` params.

## Example

```
"r": 3,
"c": 0,
"type": "fight",
"message": "You woke up a dragon",
"opponent": "Dragon",
"icon": "🐉",
"hp": 100,
"attacks": [
  {
    "name": "Red fire",
    "hp": 50
  },
  {
    "name": "Tail stroke",
    "hp": 10
  }
],
"rewards": [
  {
    "message": "You found a Broccoli",
    "object": "broccoli",
    "metrix": "hp",
    "effect": "earn",
    "points": 20,
    "icon": "🥦"
  }
]
```

At cell at 4th row, 1st column, you enter the fight mode.

The message "🐉 You woke up a dragon" is displayed.

The opponent is Dragon, it has 100 hp. Its attacks are "Red fire" that inflicts 50 hp, and "Tail stroke" that inflicts 10 hp.

When the opponent is defeated, the message "🥦 You found a Broccoli" is displayed. And the hero earn 20 hp.


# Light event

Switch on/off the entire maze.

## Example

```
"r": 0,
"c": 3,
"type": "light",
"once": 0
```

At cell at 1st row, 4th column, the `light` of the entire maze is switched on/off.

But the cells where the hero already passed are still visible.

This is the same `light` that was defined at the top of the settings.


# Message event

The message event can be used to display a message written on a paper that was found, a warning displayed on a sign, etc...

## Example

```
"r": 4,
"c": 3,
"type": "message",
"message": "Beware of the dragon",
"icon": "🖹"
```

At cell at the 5th row, 4th column, the message "🖹 Beware of the dragon" is displayed.


# Metrix event

It is used to add or remove some hp or strength to the hero.

## Params

`object` (string, optional): **TODO**

`metrix` (string, required): Values can be `hp` or `strength`

`effect` (string, required): Values can be `earn` or `lose`

`points` (int, required): How many points are gained or losen on which metrix

## Example

```
"r": 1,
"c": 0,
"type": "metrix",
"message": "You found a Talisman",
"object": "talisman",
"metrix": "hp",
"effect": "earn",
"points": 5,
"icon": "🉤"
```

At cell 2nd row and 1st column, the message displayed is "🉤 You found a Talisman".

And the hero `earn` `5` `hp`.


# Move event

This event can be used as a fall, a teleportation...

## Example

```
"r": 2,
"c": 2,
"type": "move",
"message": "You teleported",
"to": {
  "r": 3,
  "c": 8
},
"icon": "🗲",
"once": 0
```

At cell that is at 3rd row, 3rd column , the hero is moved to the cell at the 5th row and 9th column.

The message "🗲 You teleported" is displayed.

The event is not triggered once. If the hero returns to this cell, the event occurs again: hero is moved, message is displayed...


# Object event

The object event is used to add an object to the hero's objects.

## Example

```
"r": 2,
"c": 3,
"type": "object",
"message": "You found a torch and see further",
"effect": "earn",
"object": "torch",
"icon": "🔦"
```

A "🔦" torch is added to the hero objects when he comes on the cell at the 3rd row, 4th column.

There are some special objects, see below for detailed informations.

# Protected event

The protected event can be used to lock cells that are reachable only if the hero has got a certain object.

The simple usage is: a cell is locked behind a door, it needs a key to be unlocked.

## Params

`success` (object, required): what is needed to unlock and what happens what it's done

The `success` object is defined like :

`object` (string, required): the object's (exact same) name that can unlock this protected cell

`message` (string, required): the message to display when it's unlocked

`icon` (string, required): the icon to display when it's unlocked

## Example

```
"r": 8,
"c": 6,
"type": "protected",
"message": "The door is locked. You should find a key",
"icon": "🚪",
"success": {
  "object": "old key",
  "message": "You unlocked the door with the old key",
  "icon": "🗝"
}
```

The cell at 9th row, 7th column is not reachable if you don't have the `old key` object.

If you try to move there, the message "🚪 The door is locked. You should find a key" is displayed.

But if you have found the `old key`, you move there and the message "🗝 You unlocked the door with the old key" is displayed.

Of course, an object event was used elsewhere in the maze, with the `old key` object. Something lihe this :

```
"r": 2,
"c": 2,
"type": "object",
"message": "You found an old key",
"icon": "🗝",
"object": "old key"
```


# Reveal event

It can be used to light on arbitrary cells : a room, a corridor...

## Params

`cells` (array, required): Each item of this array is an object that defines a cell with its row (`r`) and column (`c`)

## Example

```
"r": 8,
"c": 7,
"type": "reveal",
"message": "A big fire lit in the middle of the room",
"icon": "🔥",
"cells": [
  {"r": 7, "c": 8},
  {"r": 7, "c": 9},
  {"r": 7, "c": 10},
  {"r": 8, "c": 8},
  {"r": 8, "c": 9},
  {"r": 8, "c": 10},
  {"r": 9, "c": 8},
  {"r": 9, "c": 9},
  {"r": 9, "c": 10}
]
```

When the hero is on the cell at 9th row, 8th column, the "room" defined by the `cells` array are lit.


# Special objects

- `torch`: lights on the cells nearby the current one.


# Add a new maze to the game

Add your maze to the `/js/config.mazefiles.js`.


# TODO

There a TODO.md file next to this README.md file. Just sayin.


# Licence

This little work is under _GNU GPLv3_ licence.