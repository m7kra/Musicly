import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import mm from 'music-metadata';

import process from 'process';
import { extname, dirname, join } from 'path';
import { app } from 'electron';
import fs from 'fs';

const databaseFolder = app.getPath('userData') + '/database/';
const databasePath = app.getPath('userData') + '/database/database.db';
const coverFolder = app.getPath('userData') + '/database/covers';

const supportedAudioFormats = ['.flac', '.mp3', '.opus', '.oga', '.ogg', '.aac', '.caf', '.m4a', '.weba'];
const supportedImageFormats = ['.png', '.jpeg', '.jpg', '.jfif'];

/**
 * Class that manages the database.
 */
export default class DB {

    /**
     * Opens the database and creates a new one if there is none. Also sets up
     * event handlers to close the database on exit. Should be called
     * immediately after constructing.
     */
    async init() {
        // Check if database exists and create one if it doesn't
        if (!fs.existsSync(databasePath)) await this.create();

        // Open DB
        this.db = await open({ filename: databasePath, driver: sqlite3.Database })
        
        // Ensure that DB will be closed on exit
        process.on('exit', this.close.bind(this));
        process.on('SIGINT', this.close.bind(this));
        process.on('SIGTERM', this.close.bind(this));
        process.on('SIGQUIT', this.close.bind(this));
    }

    /**
     * Creates a new database, at `databasePath`. 
     */
    async create() {

        fs.mkdirSync(databaseFolder);
        fs.mkdirSync(coverFolder);

        const db = await open({ filename: databasePath, driver: sqlite3.Database });
        db.exec(structure);
        db.close();
    }

    /**
     * Deletes the database.
     */
    delete() {
        fs.rmSync(databaseFolder, {recursive: true});

        process.removeListener('exit', this.close.bind(this));
        process.removeListener('SIGINT', this.close.bind(this));
        process.removeListener('SIGTERM', this.close.bind(this));
        process.removeListener('SIGQUIT', this.close.bind(this));
    }

    /**
     * Closes the database
     */
    async close() {
        await this.db.close();
    }

    /**
     * If path is a file, adds the track to a database. If it is a folder,
     * recursively walks through it, adding all the contained tracks.
     * 
     * Thanks to @Bergi in https://stackoverflow.com/questions/73005969/ensure-that-children-functions-have-terminated
     * @param {string} path 
     */
    async openPath(path) {
        const albums = await this.db.all('Select * from albums');
        const stat = fs.statSync(path);
        if (stat.isDirectory()) {
            await this.openDirectory(path);
        } else if (stat.isFile()) {
            return await this.createTrack(path);
        }
    }

    async openDirectory(path) {
        const names = fs.readdirSync(path);
        const pathStats = await Promise.all(names.map(file => {
            const newPath = path + '/' + file;
            const stat = fs.statSync(newPath);
            return {
                path: newPath,
                isFile: stat.isFile(),
                isDirectory: stat.isDirectory()
            };
        }));
        const promises = [];
        const filePaths = [];
        for (const {path, isDirectory, isFile} of pathStats) {
            if (isDirectory) {
                promises.push(this.openDirectory(path));
            } else if (isFile) {
                filePaths.push(path);
            }
        }
        promises.push(this.processDirectoryFiles(filePaths));
        return Promise.all(promises);
    }
    
    async processDirectoryFiles(filePaths) {
        for (const path of filePaths) {
            await this.createTrack(path);
        }
    }

    /**
     * Checks if `path` is a valid file format, and inserts a new track into the
     * database. If there is no corresponding album, creates a new one.
     * @param {string} track
     */
    async createTrack(path) {

        // Check if path is a valid file format
        if (!supportedAudioFormats.includes(extname(path))) return;

        // Check if track is already in the database
        const temp = await this.db.get('SELECT id FROM tracks WHERE path = ?', path);
        if (temp) return;

        const track = (await mm.parseFile(path)).common;

        // Get album id. I would like to prevent matching of albums with the
        // same name, but don't know how to do it. I used to check for the
        // artist's name, but some albums have different artists on different tracks.
        const album = await this.db.get(`
            SELECT albums.id FROM albums
            JOIN artists ON albums.artistID = artists.id
            WHERE albums.title = ?
        `, track.album);
        let albumID;
        if (album) albumID = album.id;
        else albumID = await this.createAlbum(track, dirname(path));

        // Create a new entry on the database
        await this.db.run(`
            INSERT INTO tracks
                (title, albumId, trackOrder, disc, path)
            VALUES
                (?, ?, ?, ?, ?)
        `, track.title, albumID, track.track.no, track.disk.no? track.disk.no : 1, path);

        // Since different tracks have different genres, we have to update the
        // genres of an album every time a new track is inserted
        if (track.genre) for (const genre of track.genre) {
            await this.db.run('INSERT OR IGNORE INTO genres (albumID, genre) VALUES (?, ?)', albumID, genre);
        }
    }


    /**
     * Inserts a new album into the database. Also tries to add a cover, if
     * there is any in `firstTrack`'s metadata or in the album directory. If
     * there is no corresponding artist, creates a new one.
     * @param {import('music-metadata').ICommonTagsResult} firstTrack 
     * @param {string} directory
     * @returns {int}
     */
    async createAlbum(firstTrack, directory) {

        // Get album artist
        const artist = await this.db.get('SELECT * FROM artists WHERE name = ?', firstTrack.artist);
        let artistID;
        if (artist) artistID = artist.id;
        else artistID = await this.createArtist(firstTrack.artist);

        // Enter album to the database
        const runResult = await this.db.run(`
            INSERT INTO albums
                (title, artistID, discCount)
            VALUES
                (?, ?, ?)
        `, firstTrack.album, artistID, firstTrack.disk.of? firstTrack.disk.of : 1);

        // Add cover if it is included in metadata
        if (firstTrack.picture) {
            this.addCover(firstTrack.picture[0], 'data', runResult.lastID, directory);
        }
        // Add cover if it is in album directory
        outerloop:
        for (const format of supportedImageFormats) {
            for (const name of ['cover', 'Cover', firstTrack.title]) {
                const path = `${directory}/${name}${format}`;
                if (fs.existsSync(path)) {
                    this.addCover(path, 'path', runResult.lastID, directory);
                    break outerloop;
                }
            }
        }

        return runResult.lastID;
    }

    /**
     * Removes an album from the database, as well as all the tracks and genres
     * associated with it.
     * @param {int} albumID 
     */
    async deleteAlbum(albumID) {

        // Delete album tracks
        this.db.run('DELETE FROM tracks WHERE albumID = ?', albumID);

        // Delete album artist if no other albums in the database points to him
        const album = await this.db.get('SELECT * FROM albums WHERE id = ?', albumID);
        const count = await this.db.get('SELECT COUNT(*) FROM albums WHERE artistID = ?', album.artistID);
        if (count.count == 0) this.db.run('DELETE FROM artists WHERE id = ?', album.artisID);

        // Delete cover from cover folder
        if (album.coverPath != null) fs.rm(album.coverPath, () => null);

        // Delete the album itself from database
        this.db.run('DELETE FROM albums WHERE id = ?', albumID);
    }

    /**
     * Adds an artists to the database.
     * @param {string} name
     * @returns {int}
     */
    async createArtist(name) {
        const result = await this.db.run('INSERT INTO artists (name) VALUES (?)', name);
        return result.lastID;
    }

    /**
     * Adds a new genre to the database.
     * @param {string} genre 
     * @param {int} albumID 
     */
    async createGenre(genre, albumID) {
         await this.db.run('INSERT INTO genres (albumID, genre) VALUES (?, ?)', albumID, genre);
    }

    /**
     * Deletes a genre entry from the database.
     * @param {string} genre 
     * @param {int} albumID 
     */
    async deleteGenre(genre, albumID) {
        await this.db.run(`
            DELETE FROM genres
            WHERE albumID = ? AND genre = ?
        `, albumID, genre);
    }

    /**
     * Adds a new cover to `coverFolder`, with the filename `albumID.ext`, and
     * to `albumDirectory` (querying the database if none was supplied), with
     * the filename `cover.ext`, according to `sourceType`. Updates database so
     * that it points to `coverFolder/albumID.ext`.
     * @param {string | import('music-metadata').IPicture} source 
     * @param {'path' | 'data'} sourceType 
     * @param {int} albumID 
     * @param {string} albumDirectory 
     */
    async addCover(source, sourceType, albumID, albumDirectory = undefined) {

        // Get album directory if none was supplied
        if (!albumDirectory) {
            // Path has to be retrieved from a track
            const track = await this.db.get('SELECT * FROM tracks WHERE albumID = ?', albumID);
            albumDirectory =  dirname(track.path);
        }

        // Create new files according to source type
        let extension;
        if (sourceType == 'path') {
            extension = extname(source);
            let toPath = join(coverFolder, `${albumID}${extension}`);
            await fs.copyFile(source, toPath, () => null);
            toPath = join(albumDirectory, `cover${extension}`);
            fs.copyFile(source, toPath, () => null);
        } else {
            const extensions = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
            }
            extension = extensions[source.format];
            let toPath = join(coverFolder, `${albumID}${extension}`);
            await fs.writeFile(toPath, source.data, () => null);
            toPath = join(albumDirectory, `cover${extension}`);
            fs.writeFile(toPath, source.data, () => null);
        }

        // Add the new path to the database. Note that this piece of code:
        // ?t=${new Date().getTime()} is used to prevent caching of old images
        // when the cover is changed.
        await this.db.run('UPDATE albums SET coverPath = ? WHERE id = ?', join(coverFolder, `${albumID}${extension}?t=${new Date().getTime()}`), albumID);
    }

    /**
     * Gets all the albums that match `query` and `genre`. Also returns a small
     * amount of matching tracks and all the genres in library.
     * @param {string} query 
     * @param {string} genre
     * @returns {Object}
     */
    async getLibrary(searchParameters) {
        const query = searchParameters.query;
        const genre = searchParameters.genre;

        // Get genres: this step is common to both cases
        const result = await this.db.all('SELECT DISTINCT(genre) FROM genres');
        const genres = result.map(row => row.genre);

        // Return whole library if search is empty
        if (query == '' && genre == '') {
            const albums = await this.db.all('SELECT * FROM albums');
            return { albums, tracks: {}, genres }
        }

        // Get matching albums
        const params = [`%${query}%`, `%${query}%`, `%${query}%`];
        if (genre) params.push(genre);

        const albums = await this.db.all(`
            SELECT DISTINCT(albums.id), albums.title, coverPath FROM albums
            JOIN tracks ON albums.id = tracks.albumId
            JOIN artists ON albums.artistId = artists.id
            WHERE (
                albums.title LIKE ? OR
                tracks.title LIKE ? OR
                artists.name LIKE ?
            )${genre? ` AND albums.id IN (SELECT albumID from genres WHERE genres.genre = ?)` : ''}
        `, ...params);
        // Get matching tracks
        const tracks = await this.db.all('SELECT * FROM tracks WHERE title LIKE ? LIMIT 10', `%${query}%`);

        return { albums, tracks, genres }
    }

    /**
     * Gets all the info of an album, including genres, artist and tracks.
     * @param {int} albumID
     * @returns {Object}
     */
    async getAlbum(albumID) {
        const album = await this.db.get('SELECT * FROM albums WHERE id = ?', albumID);
        let result = await this.db.all('SELECT * FROM genres WHERE albumID = ?', albumID);
        album.genres = result.map(row => row.genre);
        result = await this.db.get('SELECT * FROM artists WHERE id = ?', album.artistID);
        album.artist = result.name;
        
        return album;
    }

    /**
     * Gets the tracks mapped to `albumID`. 
     * @param {int} albumID
     * @returns {Array}
     */
    async getAlbumTracks(albumID) {
        return await this.db.all('SELECT * FROM tracks WHERE albumID = ? ORDER BY disc, trackOrder', albumID);
    }
}

const structure = `
CREATE TABLE albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    artistID INTEGER,
    discCount INTEGER,
    coverPath TEXT
);
CREATE TABLE tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
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
`