import Events from 'renderer/Events/Events';
import ControllArea from '../ControllArea/ControllArea';
import Header from '../Header/Header';
import TrackList from '../TrackList/TrackList';
import emptyCover from '../../../../assets/empty.png';

import { useEffect, useState } from 'react';
import './queue.css';

// Timeout used to detect inactivity. Should be accessible to all instances of
// Queue.
let timeoutId;
// Used to block sleeping
let blockerID;

/**
 * Component rendered inside the `App`, containing a `ControllArea` and the
 * queue. Accepts `controller` and `playback` as properties.
 */
export default function Queue({playback}) {

    // If nothing is playing, return to library
    if (!playback.track) {
        Events.fire('changeView', 'library');
        return;
    }
    
    // Variable used to track user inactivity
    const [active, setActive] = useState(true);

    // Called whenever there is a movement
    function activate() {
        clearTimeout(timeoutId);
        setActive(true);
        timeoutId = setTimeout(() => setActive(false), 2000);
    }

    // If the current album doesn't have a defined cover, use an empty one as
    // background image
    let backgroundImage = `url(${emptyCover})`;
    if (playback.album.coverPath) {
        backgroundImage = `url('file://${playback.album.coverPath}')`;
        // Ensure that the path is escaped: this is needed for Windows paths.
        // For some reason, backgroundImage = backgroundImage.replace('\\',
        // '\\\\') does'n work. Therefore, we have to change the backslashes to
        // forward ones.
        backgroundImage = backgroundImage.replace(/\\/g, '/');
    }

    // Variable that contains the id of the playing track, only if playback is
    // not paused.
    const currentTrackId = playback.track && playback.playing() && playback.track.id;

    // Set up event handlers for activate
    useEffect(() => {
        // Set up event handlers for activate
        document.addEventListener('mousemove', activate);
        document.addEventListener('keydown', activate);
        document.addEventListener('scroll', activate, true);

        if (active) activate();

        return () => {
            // Remove event handlers for activate
            document.removeEventListener('mousemove', activate);
            document.removeEventListener('keydown', activate);
            document.removeEventListener('scroll', activate, true);
        }
    });
    
    return (
        <div id='queue' style={{'--bg-image': backgroundImage}} className={active? 'active' : 'inactive'}>
            <Header />
            <div id='queue-align-bottom'>
                <div className='position-relative'>
                    <ControllArea playback={playback} />
                </div>
                <div>
                    <div id='queue-track-container' className='center-children'>
                        <TrackList tracks={playback.queue} playback={playback} parent='queue'/>
                    </div>
                </div>
            </div>
        </div>
    )
}