'use client';

import {
  ControlBar,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  RoomContext,
} from '@livekit/components-react';
import { Room, Track } from 'livekit-client';
import '@livekit/components-styles';
import { useEffect, useState } from 'react';

export default function Page() {
  const roomName = 'quickstart-room';
  const userName = 'quickstart-user';

  const [roomInstance] = useState(() =>
    new Room({
      adaptiveStream: true,
      dynacast: true,
    })
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const connectRoom = async () => {
      try {
        const resp = await fetch(`/api/token?room=${roomName}&username=${userName}`);
        const data = await resp.json();
        console.log(data);

        if (!mounted) return;

        if (data.token) {
          await roomInstance.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, data.token);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
      }
    };

    connectRoom();

    return () => {
      mounted = false;
      roomInstance.disconnect();
    };
  }, [roomInstance, roomName, userName]);

  if (loading) {
    return <div>Getting token...</div>;
  }

  return (
    <RoomContext.Provider value={roomInstance}>
      <div data-lk-theme="default" style={{ height: '100dvh' }}>
        {/* Video + screen share grid */}
        <MyVideoConference />
        {/* Plays audio for all participants */}
        <RoomAudioRenderer />
        {/* Controls for microphone, camera, and screen share */}
        <ControlBar />
      </div>
    </RoomContext.Provider>
  );
}

function MyVideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <GridLayout style={{ height: 'calc(100vh - var(--lk-control-bar-height))' }} tracks={tracks}>
      <ParticipantTile />
    </GridLayout>
  );
}
