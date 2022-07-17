interface IBitReader {
  readBits(len: number): number; //在byte之间获取bit
  setBytes(bytes: Uint8Array): void; // 放入bytes
  hasBits(size: number): boolean;
}


export default class BitReader implements IBitReader {
  bitOffset: number;
  byteOffset: number;
  bytes: Uint8Array;
  constructor() {
    this.bitOffset = 0;
    this.byteOffset = 0;
    this.bytes = new Uint8Array();
  }
  
  setBytes(bytes: Uint8Array) { 
    //在放入新的bytes之前，检查上一个是否用完
    if (this.hasBits(1)) {
      const restByte = this.bytes.byteLength - this.byteOffset
      const tmp = new Uint8Array(restByte + bytes.byteLength);
      tmp.set(this.bytes.slice(this.byteOffset));
      tmp.set(bytes, restByte);
      this.bytes = tmp;
      this.byteOffset = 0;
    } else {
      this.bitOffset = 0;
      this.byteOffset = 0;
      this.bytes = bytes;
    }
  }
  
  hasBits(size: number): boolean {
    const restBits = 8 * (this.bytes.byteLength - this.byteOffset) - this.bitOffset;
    return restBits > size;
  }


  readBits(len: number): number { // 这里的逻辑是以byte为界限
    let result = 0;
    let gotBits = 0; //累计获得了多少bit
    /*
     * 因为有时len的长度>byte 所以我们不能直接在byte里取len，而是另设一个变量x
     * 经过多次循环，跨byte去满足x >= len
     */
    while (gotBits < len) {
      // debugger
      const perBits = Math.min(8 - this.bitOffset, len - gotBits); // 单次获取多少个bit，受限于剩余bit数
      const mask = 0xff >> (8 - perBits) << this.bitOffset; // 通过mask取到对应的位置
      result += (mask & this.bytes[this.byteOffset]) >> this.bitOffset << gotBits; // 在下一个byte里补齐位数 tips: >> 优先级大于 &
      gotBits += perBits;
      this.bitOffset += perBits;
      if (this.bitOffset === 8) {
        this.bitOffset = 0;
        this.byteOffset++;
      }
    }
    return result;
  }

}