function CDG() {
  var packetSizeInBytes = 24;
  var validPacketInstruction = 9;

  // TODO normalize better (less low-level) for end-users once we have pixels/etc ...
  var instructions = {
    1: "Memory Preset", MemoryPreset: 1,
    2: "Border Preset", BorderPreset: 2,
    6: "Tile Block (Normal)", TileBlockNormal: 6,
    20: "Scroll Preset", ScrollPreset: 20,
    24: "Scroll Copy", ScrollCopy: 24,
    28: "Define Transparent Color", DefineTransparentColor: 28,
    30: "Load Color Table (0-7)", LoadColorTable1: 30,
    31: "Load Color Table (8-15)", LoadColorTable2: 31,
    38: "Tile Block (XOR)", TileBlockXOR: 38
  };

  this.onPacket = null;

  this.loadFile = function(file) {
    var reader = new FileReader();
    var packetCallback = this.onPacket;
    reader.onload = function(e) {
      var arrayBuffer = reader.result;
      var readPackets = 0;
      // TODO implement timer - you want each packet for the appropriate microsecond, not to while() thru them
      while ((readPackets * packetSizeInBytes) < arrayBuffer.byteLength) {
        var startByte = readPackets * 24;
        var bytesRemaining = arrayBuffer.byteLength - (readPackets * packetSizeInBytes);
        if (bytesRemaining < 24) {
          console.log("Only " + bytesRemaining + " left to read");
          break;
        }
        var packetBytes = new Uint8Array(arrayBuffer, startByte, 24);
        readPackets++;
        var packet = packetFromBytes(packetBytes);
        if (packet && packetCallback)
          packetCallback(packet);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  var packetFromBytes = function(packetBytes) {
    var command = packetBytes[0] & 0x3F; // only first 6 bits
    if (command != validPacketInstruction)
      return null;

    var packet = new CDGPacket();
    packet.instructionId = packetBytes[1] & 0x3F;
    packet.instructionName = instructions[packet.instructionId];

    // inline instructions - TODO refactor
    if (packet.instructionId == instructions.MemoryPreset) {
      // read data bytes from packet
      var dataBytes = new Uint8Array(packetBytes, 4, 16); // 4 is offset.  0/command, 1/instruction, 2-3/parityQ, 4-12/data, 13-16/parityP
      var color = dataBytes[0] & 0x0F; // only first 4 bits
      var repeat = dataBytes[1] & 0x0F; // ignore if repeat != 0 (? - all 1 tho ...)
      packet.color = color;
      packet.repeat = repeat;
    } else if (packet.instructionId == instructions.LoadColorTable1) {
      var dataBytes = new Uint8Array(packetBytes, 4, 16); // 4 is offset.  0/command, 1/instruction, 2-3/parityQ, 4-12/data, 13-16/parityP
      // 4 bits for R, G, and B ...
    }

    return packet;
  }
}

function CDGPacket() {
}