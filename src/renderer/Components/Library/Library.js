import Cover from '../Cover/Cover';
import ControllArea from '../ControllArea/ControllArea';
import SearchBox from '../SearchBox/SearchBox';
import Header from '../Header/Header';
import { FolderPlus } from 'react-bootstrap-icons';

import Events from 'renderer/Events/Events';
import { useState, useMemo, useEffect } from 'react';
import TrackList from '../TrackList/TrackList';
import './library.css';
import Button from '../Button/Button';

/**
 * Component rendered inside the `App`, displaying an album's details such as
 * cover, `TrackList` and artist. Also has a `ControllArea`. Accepts
 * `playback` as property.
 * @param {Object} properties 
 */
export default function Library({library, playback}) {

    let albums = library.albums.map((album, index) => {
        const title = limitTitle(album.title);
        return <div className='col-xxl-2 col-lg-3 col-md-4 col-sm-6 p-xxl-2 p-3' key={index}>
            <Cover album={album} buttons={['play', 'details']} parent={'library'}/>
            <div className='spacer-8'></div>
            <h5 className='text-center'>{title}</h5>
        </div>;
    });

    // Add something to the library if it's empty
    if (albums.length == 0) {
        albums = (
            <>
                <div className='spacer-48' />
                <div id='empty-library' className='col-12 d-flex flex-column align-items-center justify-content-center'>
                    <div className='spacer-100' />
                    <h3>Nothing here</h3>
                    <div className='spacer-8' />
                    <FolderPlus size={48} />
                    <div className='spacer-8' />
                    <p>Your library is empty. You can drag you music files here, click the button below or use the menu to locate your music.</p>
                    <div className='spacer-100' />
                </div>
                <div className='spacer-24' />
            </>
        );
    }

    // Keep track of scrolling state
    useEffect(() => {
        document.querySelector('#library').scrollTo(0, window.scrollInLibrary);
    })
    function updateScroll() {
        window.scrollInLibrary = document.querySelector('#library').scrollTop;
    }

    return (
        <>
            <Header library={true} /><div className='header-placeholder' />
            <div className='spacer-24'/>
            <div id='library' onScroll={updateScroll}>
                <div className='row justify-content-center'>
                    <div className='col-11'>
                        <div className='spacer-48' />
                        <div className='d-flex center-children'>
                            <h1>Library:</h1>
                            <div className='w-100'></div>
                            <SearchBox searchParameters={library.searchParameters} genres={library.genres} />
                        </div>
                        <div className='spacer-48' />
                        <div className='row'>
                            {albums}
                        </div>
                        <TrackList tracks={library.tracks} playback={playback} parent='library'/>
                        <div className='spacer-24' />
                        <Button onClick={() => Events.fire('open', 'folder')} type='outline'>Locate music</Button>
                        {/*
                            This second button was removed because it confused new users. Just in case I change my mind, here it is:
                            <Button onClick={() => Events.fire('open', 'file')} type='outline'>Add files to library</Button>  
                        */}
                        <div className='spacer-300' />
                    </div>
                </div>
            </div>
            <ControllArea playback={playback} />
        </>
    )
}

// Limits title to a fixed number of characters
const LIMIT = 20;
function limitTitle(title) {
    let temp = title.substring(0, LIMIT);
    temp.trim();
    if (title.length > LIMIT) temp += '...';
    return temp;
}