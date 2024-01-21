Known error - Unsure how to fix :

The buffer payload sent with ipc right after encoding the data to update the rich presence inside the library `discord-rpc` at the file `src/transports/ipc.js` can sometimes fail during the socket.write(buffer). Resulting in a `data: { code: 1000, message: 'Unknown Error' }` when decoding that same buffer. I'm unsure what happen inside the `net` library that cause this issue since everything up until that point is clear.

However, while it may throw and unhandled error the electron app does not crash.
But it does mess with the update of the rich presence.

Known issue - Won't fix :

There's an intended small delay of half a second when you forward/backward regarding the time shown on the rp. It might aswell cause a slight delay between 0 and 1 second after that action, but there's no way to prevent it because the half second delay is there to prevent an extensive update of the rp which is not necessary.