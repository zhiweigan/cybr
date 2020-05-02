const should = require('should');
const mocha = require('mocha');
const fluid = require('../src/index');
const net = require('net')
const osc = require('osc-min')

// This function is intended to be passed in to net.createServer(onConnection).
// It will be called whenever a connection is established with a `net.Socket`
// as an argument.
const onConnection = (sock) => {

  // Emitted once the socket is fully closed. The argument hadError is a boolean
  // which says if the socket was closed due to a transmission error.
  sock.on('close',   (msg) => {  });

  // Emitted when a socket connection is successfully established. 
  sock.on('connect', (msg) => {  });

  // Emitted when data is received. The argument data will be a Buffer or
  // String. Encoding of data is set by socket.setEncoding(). The data will be
  // lost if there is no listener when a Socket emits a 'data' event.
  sock.on('data',    (msg) => {
    //Using different addresses to test for different scenarios.
    ms = osc.fromBuffer(msg.slice(8));
    if(ms.address == '/audiotrack/select'){
      for(i = 0; i < 28; i++){
        msg[8+i] -= 1;
      }
      sock.write(msg);
    }
    else if(ms.address == '/audiotrack/mute'){
      sock.write("-=-=-==--=-=-=-");
    }
    else if(ms.address == '/audiotrack/set/db'){
      setTimeout(() => { sock.write(msg) }, 4000);
    }
    else{
      sock.write(msg);
    }

  });

  // Emitted when the write buffer becomes empty. Can be used to throttle
  // uploads.
  sock.on('drain',   (msg) => {  });

  // Emitted when the other end of the socket sends a FIN packet, thus ending
  // the readable side of the socket.
  sock.on('end',     (msg) => {  });

  // Emitted when an error occurs. The 'close' event will be called directly
  // following this event.
  sock.on('error',   (msg) => {  });

  // Emitted after resolving the host name but before connecting. Not applicable
  // to Unix sockets.
  sock.on('lookup',  (msg) => {  });

  // Emitted when a socket is ready to be used. Triggered immediately after
  // 'connect'.
  sock.on('ready',   (msg) => {  });

  // Emitted if the socket times out from inactivity. This is only to notify
  // that the socket has been idle. The user must manually close the connection.
  sock.on('timeout', (msg) => {  });
};

describe('fluid.Client (TCP/IPC Client)', function() {
  this.timeout(5000);
  const PORT = 22354;
  let server;

  before(function(done) {
    server = net.createServer(onConnection);
    server.listen(PORT);
    server.on('listening', done);
  });

  it('When client connects and sends valid message, the promise returned by client.send should be resolved', (function() {
    const client = new fluid.Client(22354);
    const result = client.send(fluid.midiclip.clear());
    return result.should.be.resolved();
  }));

  it('When client cannot connect, the promise returned by client.send should be rejected', (function() {
    // Attempt to connect to a port that is not listening
    const client = new fluid.Client(33354);

    // .rejected() returns a promise indicating to mocha that this test is
    // async. If the promise is not resolved or rejected within mocha's timeout,
    // the test fails.
    const result = client.send(fluid.audiotrack.select('hi'));
    return result.should.be.rejected();
  }));

  it('When server returns an invalid response, the promise returned by client.send should be rejected', (function() {
    const client = new fluid.Client(22354);
    const result = client.send(fluid.audiotrack.select('hi'));
    return result.should.be.rejected();
  }));

  it('When the client sends an incomplete message, the promise should be rejected', (function() {
    const client = new fluid.Client(22354);
    const result = client.send(fluid.audiotrack.mute());
    return result.should.be.rejected();
  }));

  it('When server takes too long to respond, the promise should be rejected', (function() {
    const client = new fluid.Client(22354);
    const result = client.send(fluid.audiotrack.gain(1));
    return result.should.be.rejected();
  }));

  after(function() {
    server.close();
  });
});
