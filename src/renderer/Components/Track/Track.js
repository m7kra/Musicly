import Events from 'renderer/Events/Events';
import { addContextMenu } from '../ContextMenu/ContextMenu';
import Button from '../Button/Button';
import { X, Pencil, CheckLg } from 'react-bootstrap-icons';

import { useEffect, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import './track.css';

/**
 * Displays a single track. The component should display the track number and
 * name, and also a sprite if it is currently playing. `jump` and `tracks`
 * property specify which tracks should be played if this track is clicked (in
 * an album, for instance, you want the user to be able choose a track and play
 * all the ones that come after it). `parent` is the component that contains the
 * track, and if `parent == queue` a button allowing to remove the track from
 * the queue should be displayed. If `parent == albumDetails`, the track should
 * be editable (i.e., the title and composer should be changeable). An optional
 * property `dummy` should prevent all events from being fired. It is used in
 * the tutorial.
 */
export default function Track({track, classes, playing, tracks, jump, dummy = false, parent, isDragging}) {

    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(track.title);
    const [composer, setComposer] = useState(track.composer);
    const id = useMemo(() => nanoid(), []);

    function updateTrackInfo() {
        Events.fire('updateTrackInfo', track.albumID, track.id, {
            ...track,
            title,
            composer
        });
        setEditing(false);
    }
    
    classes.push('row');
    classes.push('track');
    if (isDragging) classes.push('dragging');
    if (editing) classes.push('editing');

    const actions = [
        { text: 'Play Track', onClick: () => Events.fire('getTracks', 'track', track, `playTracks`) },
        { text: 'Play Track Next', onClick: () => Events.fire('getTracks', 'track', track, `addNext`) },
        { text: 'Play Track Later', onClick: () => Events.fire('getTracks', 'track', track, `addToQueue`) },
        { text: 'Play Tracks', onClick: () => Events.fire('getTracks', 'tracks', tracks, `playTracks`, jump) },
        { text: 'Play Tracks Next', onClick: () => Events.fire('getTracks', 'tracks', tracks.slice(jump), `addNext`) },
        { text: 'Play Tracks Later', onClick: () => Events.fire('getTracks', 'tracks', tracks.slice(jump), `addToQueue`) }
    ];

    useEffect(() => {
        let element = document.querySelector(`#track-${id}`)
        addContextMenu(element, actions);
    });

    const button = parent == 'queue'?
        <Button onClick={(e) => { Events.fire('removeFromQueue', jump); e.stopPropagation();}} type={'nodecor'}>
            <X size={20} />
        </Button> : 
        parent == 'albumDetails'?
        editing?
        <Button onClick={(e) => { updateTrackInfo(); e.stopPropagation();}} type={'nodecor'}>
            <CheckLg size={20} />
        </Button> :
        <Button onClick={(e) => { setEditing(true); e.stopPropagation();}} type={'nodecor'}>
            <Pencil size={14} />
        </Button> : null;

    function onBlur(e) {
        // Only unset editing if no children are focused
        if (!e.target.contains(e.relatedTarget) && e.target == e.currentTarget) setEditing(false);
    }

    return (
        <div id={`track-${id}`} className={classes.join(' ')} onClick={!editing? actions[3].onClick : null} onBlur={onBlur} tabIndex={-1}>
            <div className='col-1 d-flex justify-content-center align-items-end'><PlayingBars playing={playing} /></div>
            <div className='col-1'>{track.trackOrder}</div>
            <div className='col-1'/>
            <div className='col-4'>{!editing?
                limitTitle(title) :
                <input className='detail-input' type='text' placeholder='Title' value={title} onChange={(e) => setTitle(e.target.value)} />
            }</div>
            <div className='col-1'/>
            <div className='col-3'>{!editing?
                composer :
                <input className='detail-input' type='text' placeholder='Composer' value={composer} onChange={(e) => setComposer(e.target.value)} />
            }</div>
            <div className={'col-1 d-flex' + (parent == 'queue'? ' justify-content-end' : '')}>{button}</div>
        </div>
    )
}

/**
 * Sprite indicating that the track is playing
 */
function PlayingBars({playing}) {

    // If track is not playing, the sprite should not be shown
    if (!playing) return;

    return (
        <div id='playing-bars'>
            <div id='playing-bar-1' className='playing-bar'></div>
            <div id='playing-bar-2' className='playing-bar ms-1 me-1'></div>
            <div id='playing-bar-3' className='playing-bar'></div>
        </div>
    )
}

// Limits title to a fixed number of characters
const LIMIT = 50;
function limitTitle(title) {
    let temp = title.substring(0, LIMIT);
    temp.trim();
    if (title.length > LIMIT) temp += '...';
    return temp;
}