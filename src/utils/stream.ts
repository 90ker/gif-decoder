import { IStream } from "../type";

export default class Stream implements IStream {
  dataView: DataView;
  offset: number;
  endianess: boolean; // 位读取顺序，gif为true: 低位到高位，与人类阅读顺序相反
  constructor(dataView: DataView, endianess: boolean) {
    this.dataView = dataView;
    this.offset = 0;
    this.endianess = endianess;
  }
  readUint8() {
    const byte = this.dataView.getUint8(this.offset);
    this.offset++;
    return byte;
  }
  readUint16() {
    const byte2 = this.dataView.getUint16(this.offset, this.endianess);
    this.offset += 2;
    return byte2;
  }
  slice(offset: number, length: number): Uint8Array {
    return new Uint8Array(this.dataView.buffer, offset, length);
  }
  setOffset(offset: number): void {
    this.offset = offset;
  }
}