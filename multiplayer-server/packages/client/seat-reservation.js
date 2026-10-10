import {Client} from '@colyseus/sdk';

/** The pinned SDK does not reject a close-before-join or time out its handshake.
 * Capture its protected room factory so failed attempts can close their sockets.
 * Reuse the caller's reservation; never perform another admission here. */
export async function consumeReservedSeat(endpoint,reservation,{signal,timeoutMs=3000}={}) {
  let room,closedListener,timer,rejectPending;
  const interrupted=new Promise((_,reject)=>{rejectPending=reject;});
  const abort=()=>rejectPending(new Error('Room admission canceled'));
  class AdmissionClient extends Client {
    createRoom(...args) {
      room=super.createRoom(...args);
      room.reconnection.enabled=false;
      closedListener=()=>rejectPending(new Error('Socket closed before room admission'));
      room.onLeave(closedListener);
      return room;
    }
  }
  if(signal?.aborted)throw new Error('Room admission canceled');
  signal?.addEventListener('abort',abort,{once:true});
  timer=setTimeout(()=>rejectPending(new Error('Room handshake timed out')),timeoutMs);
  try {
    return await Promise.race([new AdmissionClient(endpoint).consumeSeatReservation(reservation),interrupted]);
  } catch(error) {
    if(room) {room.reconnection.enabled=false;room.connection?.close();}
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort',abort);
    if(room&&closedListener)room.onLeave.remove(closedListener);
  }
}
