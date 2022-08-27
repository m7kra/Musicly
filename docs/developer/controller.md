---
permalink: /docs/dev/controller
layout: docs
title: Controller
---

# Controller
{:.no_toc}

## Table of Contents
{:.no_toc}

* TOC
{:toc}

## Controller

Class that manages the app. Data access, state managing and music playing are its most important functions. It is divided into two other classes: `Playback` and `StateManager`.

### Constructor

```js
class Controller {
    constructor(setView, setPlayback, setLoading, setTheme, setTutorial) {
        ...
        this.playback = new Playback(...);
        this.stateManager = new StateManager(...);
        ...
    }
}
```

## PlaybackManager

Class that controls what is playing, what will play next, when to pause, etc., using the [Howler](https://howlerjs.com/) library.

### Constructor

```js
class Playback {
    constructor(setPlayback) {
        ...
        this.playback = {
            album: null, // Object that stores info about the playing album
            track: null, // Object that stores info about the playing track
            queue: [], // Array of tracks in queue
            position: 0, // Index of the playing track in queue
            progress: () => 0, // Returns a value between 0 and 1
            playing: () => false // Is playback playing or paused?
        };
        ...
    }
}
```

### Methods

#### `start`

**Description:** Starts the playback of a new track, according to `playback.position`.

**Arguments:** None

**Return value:** None

#### `play`

**Description:** Continues the playback.

**Arguments:** None

**Return value:** None

#### `pause`

**Description:** Pauses the playback.

**Arguments:** None

**Return value:** None

#### `stop`

**Description:** Stops the playback and sets the properties of `playback` to their default value.

**Arguments:** None

**Return value:** None

#### `seekFwd`

**Description:** Advances playback 5 seconds.

**Arguments:** None

**Return value:** None

#### `seekBwd`

**Description:** Retards playback 5 seconds.

**Arguments:** None

**Return value:** None

#### `skipFwd`

**Description:** Increments `position` and plays the corresponding track. If all tracks in `playback.queue` were played, `playback` is set to its default values.

**Arguments:** None

**Return value:** None

#### `skipBwd`

**Description:** If playing time is greater than 5 seconds, returns to beginning of the track. If this condition is not true, decrements `position` and plays the corresponding track.

**Arguments:** None

**Return value:** None

#### `setProgress`

**Description:** Sets the music progress to the percentage given in the argument.

**Arguments:** `progress`

**Return value:** None

#### `playTracks`

**Description:** Immediately stops current playback and plays the supplied list of tracks. Tracks that were played previously are to be kept in `playback.queue`.

**Arguments:** `tracks`

**Return value:** None

#### `addNext`

**Description:** Adds the supplied list of tracks to the queue, right next to the currently playing one.

**Arguments:** `tracks`

**Return value:** None

#### `addToQueue`

**Description:** Adds the supplied list of tracks to the end of the queue.

**Arguments:** `tracks`

**Return value:** None

#### `getTracks`

**Description:** Gets tracks according to `sourceType` and `detail` and forwards them to `playTracks`, `addNext` or `addToQueue` according to `destination`.

**Arguments:** `sourceType` (`albumID`, `track` or `tracks`), `detail` (depending on the value of `sourceType`, an integer, a track or a list of tracks).

**Return value:** None

#### `updatePlayback`

**Description:** Updates the state of UI elements depending so that they match `playback`.

**Arguments:** None

**Return value:** None

### Event listeners

Since this apps tries to follow an MVC structure, most of the functions in `PlaybackManager` are triggered by events. `PlaybackManager` should set up event listeners for `play`, `pause`, `stop`, `seekFwd`, `seekBwd`, `skipFwd`, `skipBwd`, `setProgress` and `getTracks`.

## StateManager

Class that controls the state and visual appearance of various app components.

### Constructor

Upon constructing, `StateManager` should implement the settings and store them in `window.settings` (for use in other components).

```js
class StateManager {
    constructor (setView, setLoading, setTheme, setTutorial) {
        ...
    }
}
```

### Methods

#### `setView`

**Description:** Sets the app view to `view`. If `view == albumDetails`, updates `viewingAlbumID` to `albumID`.

**Arguments:** `view`,` albumID = 0`

**Return value:** None

#### `getLibrary`

**Description:** Gets the library according to `searchParameters` and passes them to `setLibrary`.

**Arguments:** `searchParameters`, `setLibrary`

**Return value:** None

#### `getAlbumDetails`

**Description:** Gets the details of the album that matches `viewingAlbumID` and calls `setDetails` with them.

**Arguments:** `setDetails`

**Return value:** None

#### `getSettings`

**Description:** Gets the current settings and passes them on to `setSettings`.

**Arguments:** `setSettings`

**Return value:** None

#### `setSettings`

**Description:** Sets the provided settings and makes the necessary changes to the app. `firstTime` should always be saved as false.

**Arguments:** `settings`

**Return value:** None

#### `implementSettings`

**Description:** Adapts the app to the current `settings`.

**Arguments:** `settings`

**Return value:** None

#### `resetSettings`

**Description:** Restores settings to their original value.

**Arguments:** `setSettings`

**Return value:** None

#### `open`

**Description:** Calls the main process' `open` handler and refreshes the library after it.

**Arguments:** `setLibrary`

**Return value:** None

#### `addCover`

**Description:** Calls the main process' `addCover` handler and refreshes the component that called it according to `caller`.

**Arguments:** `albumID`, `caller` (`albumDetails` or `library`), `updateComponent`

**Return value:** None

#### `deleteAlbum`

**Description:** Calls the main process' `deleteAlbum` handler and refreshes the library after it.

**Arguments:** `albumID`, `setLibrary`

**Return value:** None

#### `addGenre`

**Description:** Adds a genre to an album and updates the `AlbumDetails` component.

**Arguments:** `genre`, `albumID`, `setDetails`

**Return value:** None

#### `deleteGenre`

**Description:** Deletes a genre from an album and updates the `AlbumDetails` component.

**Arguments:** `genre`, `albumID`, `setDetails`

**Return value:** None

#### `windowButton`

**Description:** Calls the main process's `windowButton` handler.

**Arguments:** `button`

**Return value:** None

#### `displayTutorial`

**Description:** Displays an introductory tutorial.

**Arguments:** None

**Return value:** None

#### `resetLibrary`

**Description:** Deletes the database.

**Arguments:** None

**Return value:** None

### Event listeners

`StateManager` should set up event listeners for `setView`, `getLibrary`, `getAlbumDetails`, `getSettings`, `setSettings`, `open`, `addCover`, `deleteAlbum`, `addGenre`, `deleteGenre`, `windowButton`, `resetLibrary` and `resetSettings`.  