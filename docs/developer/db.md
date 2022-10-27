---
permalink: /docs/dev/db
layout: docs
title: DB

---

# DB
{:.no_toc}

## Table of contents
{:.no_toc}

* Toc
{:toc}

## The DB class

This class manages the database. No arguments are needed when constructing. After this, `db.init` should always be called. This is a hack to allow for an `async/await` use.

### Methods

#### `init`

**Description:** Opens the database and creates a new one if there is none. Also sets up event handlers to close the database on exit. Should be called immediately after constructing.

**Arguments:** None

**Return value:** None

#### `create`

**Description:** Creates a new database at `databasePath`.

**Arguments:** None

**Return value:** None

#### `delete`

**Description:** Removes the database from the file system.

**Arguments:** None

**Return value:** None

#### `close`

**Description:** Closes the database

**Arguments:** None

**Return value:** None

#### `openPath`

**Description:** If path is a file, adds the track to a database. If it is a folder, recursively walks through it, adding all the contained tracks. While files in the same folder should be processed in a synchronized way (assuming that albums are in a same folder), files in different folders may be processed using async calls. Should return when all children processes are terminated.

**Arguments:** `path`

**Return value:** None

#### `createTrack`

**Description:** Checks if `path` is a valid file format and has valid metadata, and inserts a new track into the database. If there is no corresponding album, creates a new one. Tracks that don't have album info should be added to an album called 'Unknown'.

**Arguments:** `path`

**Return value:** None

#### `createAlbum`

**Description:** Inserts a new album into the database. Also tries to add a cover, if there is any in `firstTrack`'s metadata or in the album directory. If there is no corresponding artist, creates a new one. Note: it is assumed that tracks in the same album also share the same folder.

**Arguments:** `firstTrack`, `directory`

**Return value:** `albumID`

#### `deleteAlbum`

**Description:** Removes an album from the database, as well as all the tracks and genres associated with it.

**Arguments:** `albumID`

**Return value:** None

#### `createArtist`

**Description:** Adds an artists to the database.

**Arguments:** `name`

**Return value:** `artistID`

#### `createGenre`

**Description:** Adds a new genre to the database.

**Arguments:** `albumID`, `genre`

**Return value:** None



#### `addCover`

**Description:** Adds a new cover to `coverFolder`, with the filename `[albumID].[extension]`, and to `albumDirectory` (querying the database if none was supplied), with the filename `cover.[ext]`, according to `sourceType`. Updates database so that it points to `coverFolder/[albumID].[ext]`.

**Arguments:** `source`, `sourceType` (`path` or `data`),`albumID`, `albumDirectory` (optional)

**Return value:** None

#### `getLibrary`

**Description:** Gets all the albums that match `query` and `genre`. Also returns a small amount of matching tracks and all the genres in library.

**Arguments:** `query`, `genre`

**Return value:** `{albums, tracks, genres}`

#### `getAlbum`

**Description:** Gets all the information about an album, including genres, artist and tracks.

**Arguments:** `albumID`

**Return value:** `album`

#### `getAlbumTracks`

**Description:** Gets the tracks mapped to `albumID`.

**Arguments:** `albumID`

**Return value:** `tracks`

#### `updateAlbumInfo`

**Description:** Updates an album's information to match up with the given one. Tracks whose format is `mp3` should updated to reflect changes.

**Arguments** `albumID`, `albumInfo`

**Return value:** None

#### `updateTrackInfo`

**Description:** Updates the track's entry on the database and, if the track itself is in `mp3` format, changes its tags using `node-id3` module.

**Arguments:** `trackID`, `trackInfo`

**Return value:** None

## Structure

The initial SQL script to be run defines four tables: albums, tracks, artists and genres:

```sql
CREATE TABLE albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    directory TEXT,
    artistID INTEGER,
    discCount INTEGER,
    coverPath TEXT
);
CREATE TABLE tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    composer TEXT,
    albumID INTEGER,
    trackOrder INTEGER,
    disc INTEGER,
    path TEXT
);
CREATE TABLE artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
);
CREATE TABLE genres (
    albumID INTEGER,
    genre TEXT,
    UNIQUE(albumID, genre)
);
```

## Paths

The paths used by the `DB` class are these:

- `databaseFolder = [userData]/database/`

- `databasePath = [userData]/database/database.db`

- `coverFolder = [userData]/database/covers`

## File formats

The `DB` class is in charge of checking whether a file may be used as a track or as an image. The following formats are supported:

- Music: `.flac`, `.mp3`, `.opus`, `.ogg`, `.aac`, `.m4a`

- Image: `.png`, `.jpeg`, `.jpg`, `.jfif`, `.webp`, `.gif`, `.svg`, `.bmp`, `.ico`