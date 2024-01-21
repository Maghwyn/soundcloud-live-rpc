Known error :

The buffer payload sent with ipc right after encoding the data to update the rich presence inside the library `discord-rpc` at the file `src/transports/ipc.js` can sometimes fail during the socket.write(buffer). Resulting in a `data: { code: 1000, message: 'Unknown Error' }` when decoding that same buffer. I'm unsure what happen inside the `net` library that cause this issue since everything up until that point is clear.

However, while it may throw and unhandled error the electron app does not crash.
But it does mess with the update of the rich presence.