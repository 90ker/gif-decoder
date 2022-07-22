import { LogicScreen, ImgScreen, Img, GraphControl } from './type';
import Stream from './utils/stream';
import BitReader from './utils/bitReader';
import { byte2bitStr } from './utils/util'


class GifInstance {
  private stream!: Stream;

  // 全局
  header!: string;
  logicScreen!: LogicScreen;
  globalColor!: Array<Array<number>>;

  // 扩展
  applications!: Array<string>;
  comments!: Array<string>;
  graphControls!: Array<GraphControl>;
  plainTexts!: Array<string>;

  // 图像
  imgs!: Array<Img>;

  constructor(dataview: DataView) {
    this.setStream(dataview);
    this.setGlobal();
    this.setLocal();
  }

  setStream(dataview: DataView) {
    this.stream = new Stream(dataview, true);
  }

  setGlobal() {
    this.header = this.getHeader();
    this.logicScreen = this.getLogicScreen();
    const { globalColorTableFlag, globalColorTableSize } = this.logicScreen.packageField
    this.globalColor = this.getColor(globalColorTableFlag, globalColorTableSize);
  }

  setLocal() {
    this.plainTexts = [];
    this.graphControls = [];
    this.comments = [];
    this.applications = [];
    this.imgs = []
    const { stream } = this;
    while (stream.offset < stream.dataView.byteLength) {
      let flagByte = stream.readUint8();
      if (flagByte === 33) { // 扩展
        this.setExtension();
      } else if (flagByte === 44) {
        this.setImg();
      }
    }
  }

  getHeader() {
    let tmp = '';
    for (let i = 0; i < 6; i++) {
      tmp += String.fromCharCode(this.stream.readUint8());
    }
    return tmp;
  }

  getLogicScreen() {
    const { stream } = this;
    const ls: LogicScreen = {
      canvasWidth: 0,
      canvasHeight: 0,
      packageField: {
        globalColorTableFlag: 0,
        colorResolution: 0,
        sortFlag: 0,
        globalColorTableSize: 0
      },
      bgColorIndex: 0,
      pxAspectRadio: 0
    }

    ls.canvasWidth = stream.readUint16();
    ls.canvasHeight = stream.readUint16();
    const packageFieldByte = stream.readUint8();

    let packageFieldBits = byte2bitStr(packageFieldByte);
    ls.packageField = {
      globalColorTableFlag: parseInt(packageFieldBits[0], 2),
      colorResolution: parseInt(packageFieldBits.slice(1, 4), 2),
      sortFlag: parseInt(packageFieldBits[4], 2),
      globalColorTableSize: parseInt(packageFieldBits.slice(5, 8), 2)
    }
    ls.bgColorIndex = stream.readUint8();
    ls.pxAspectRadio = stream.readUint8();

    return ls;
  }

  setExtension() {
    const { stream } = this;
    let type = stream.readUint8();
    switch (type) {
      case 1: //纯文本
        this.plainTexts.push(this.getPlainText());
        break;
      case 249: // 图像控制
        this.graphControls.push(this.getGraphControl());
        break;
      case 254: // 评论
        this.comments.push(this.getComment());
        break;
      case 255: //应用
        this.applications.push(this.getApplication());
        break;
    }
    let code = stream.readUint8();
    if (code !== 0) {
      throw new Error('EOF 解析出错！！！')
    }
  }

  setImg() {
    const img: Img = {
      imgScreen: {
        left: 0,
        right: 0,
        width: 0,
        height: 0,
        packageField: {
          localColorTableFlag: 0,
          interlaceFlag: 0,
          sortFlag: 0,
          unUse: 0,
          localColorTableSize: 0
        }
      },
      localColor: [],
      data: []
    };
    img.imgScreen = this.getImgScreen();
    const { localColorTableFlag, localColorTableSize } = img.imgScreen.packageField;
    img.localColor = this.getColor(localColorTableFlag, localColorTableSize);
    img.data = this.getImgData();

    this.imgs.push(img);
  }

  getImgScreen() {
    const { stream } = this;
    const imgScreen: ImgScreen = {
      left: 0,
      right: 0,
      width: 0,
      height: 0,
      packageField: {
        localColorTableFlag: 0,
        interlaceFlag: 0,
        sortFlag: 0,
        unUse: 0,
        localColorTableSize: 0
      }
    }

    imgScreen.left = stream.readUint16();
    imgScreen.right = stream.readUint16();
    imgScreen.width = stream.readUint16();
    imgScreen.height = stream.readUint16();
    let packageFieldBits = byte2bitStr(stream.readUint8());
    imgScreen.packageField = {
      localColorTableFlag: parseInt(packageFieldBits[0], 2),
      interlaceFlag: parseInt(packageFieldBits[1], 2),
      sortFlag: parseInt(packageFieldBits[2], 2),
      unUse: parseInt(packageFieldBits.slice(3, 5), 2),
      localColorTableSize: parseInt(packageFieldBits.slice(5, 8), 2)
    }
    
    return imgScreen;
  }
  
  getPlainText() {
    const { stream } = this;
    let size = stream.readUint8();
    let content = '';
    while (size) {
      content += String.fromCharCode(stream.readUint8());
      size--;
    }
    return content;
  }

  getGraphControl() {
    const { stream } = this;
    const gc: GraphControl = {
      dataSize: 0,
      packageField: {
        unUse: 0,
        disposalMethod: 0,
        userInputFlag: 0,
        transparentColorFlag: 0,
      },
      delayTime: 0,
      transparentColorIndex: 0
    }
    gc.dataSize = stream.readUint8();
    const packageFieldBits = byte2bitStr(stream.readUint8());
    gc.packageField = {
      unUse: parseInt(packageFieldBits.slice(0, 3), 2),
      disposalMethod: parseInt(packageFieldBits.slice(3, 6), 2),
      userInputFlag: parseInt(packageFieldBits[6], 2),
      transparentColorFlag: parseInt(packageFieldBits[7], 2)
    }
    gc.delayTime = stream.readUint16();
    gc.transparentColorIndex = stream.readUint8();

    return gc;
  }

  getComment() {
    const { stream } = this;
    let size = stream.readUint8();
    let content = ''
    while (size) {
      content += String.fromCharCode(stream.readUint8());
      size --;
    }
    return content;
  }

  getApplication() {
    const { stream } = this;
    let size = stream.readUint8();
    let content = '';
    while (size) {
      content += String.fromCharCode(stream.readUint8());
      size --;
    }

    let noUseCode = stream.readUint8();
    while (noUseCode) {
      stream.readUint8();
      noUseCode--;
    }
    return content;
  }

  getImgData() {
    const { stream } = this;
    const indexStream: Array<number> = [];

    const minCodeSizeLZW = stream.readUint8();
    let subBlockSize = stream.readUint8();
    let blocks: Array<Uint8Array> = [];
    // 1. stream -> blocks
    while (subBlockSize) {
      blocks.push(stream.slice(stream.offset, subBlockSize));
      stream.setOffset(stream.offset + subBlockSize);
      subBlockSize = stream.readUint8();
    }
    // 2. blocks -> codeStream -> indexStream
    const bitReader = new BitReader(); // bytes -> codeStream
    let codeStream: Array<number> = [];
    let codeTable: Array<Array<number>> = [];

    const clearCode = 1 << minCodeSizeLZW;
    const EOICode = (1 << minCodeSizeLZW) + 1;
    let size = minCodeSizeLZW + 1;
    let initedCodeStream = false;
    // 单张图片的解析
    blocks.forEach(block => { // 本来可以通过将block都set到一个Unit8Array里去，但是会占用更多内存
      bitReader.setBytes(block);
      let maxCode = (1 << size) - 1;
      while(bitReader.hasBits(size)) {
        let code = bitReader.readBits(size);
        if (code === EOICode) { // 每张图片一个，但不太明白和EOF的区别
          codeStream.push(code);
          break;
        } else if (code === clearCode) { // 一般在每个subBlock的开头，用来初始化
          codeStream = [];
          codeTable = [];
          for(let i = 0; i <= EOICode; i++) {
            codeTable[i] = i < clearCode ? [i] : [];
          }
          initedCodeStream = false;
        } else if (!initedCodeStream) {
          indexStream.push(...codeTable[code]);
          initedCodeStream = true;
        } else { // 处理code
          let prevCode = codeStream[codeStream.length - 1];
          let y = 0;
          if (code <= codeTable.length - 1) { // 如果当前的code小于codeTable长度，直接取
            indexStream.push(...codeTable[code]);
            y = codeTable[code][0];
          } else { 
            /*
             * 由lzw压缩可知，indexStream 生成 -> codeTable -> codeStream ，但是解压是 codeStream -> indexStream -> codeTable
             * 这就导致了一个时差，所以codeStream只能生成上一次的codeTable
             * 压缩时有一种极限的情况，即本次使用的code就是上次生成的codeTable
             * 所以在解压时，这种情况不好处理     【indexStream】 xbc y - > xbcy
             * 但天无绝人之路，我们发现在这种情况中                 \        ^
             *                                                \      |
             * 设x、y为未知数，他们的数量关系是==，上图推导出          [xbcy]
             * 
            */ 
            y = codeTable[prevCode][0];
            indexStream.push(...codeTable[prevCode], y);
          }

          if(codeTable.length - 1 < 0xfff) { // codeTable的index就是codeStream的值
            // 每回合最后生成一个新的字典kv, 这里的y含义就是当前 code 对应IndexStream的第一个
            codeTable.push([...codeTable[prevCode], y]);
            // if (code === maxCode && code < 0xfff) {  code 并不一定是线性增长的，但codetable是
            if(codeTable.length - 1 === maxCode && codeTable.length - 1 < 0xfff) {
              size ++;
              maxCode = (1 << size) - 1;
            }
          }
        }
        codeStream.push(code);
      }
    })

    return indexStream;
  }

  getColor(flag: number, size: number) {
    const { stream } = this;

    if (flag) {
      return this.getColorTable(stream, (2 << size) * 3);
    } else {
      return [];
    }
  }

  getColorTable(stream: Stream, tableSize: number) {
    const tableCode = [];
    while (tableSize) {
      const rgb = [stream.readUint8(), stream.readUint8(), stream.readUint8()];
      tableCode.push(rgb);
      tableSize -= 3;
    }
    return tableCode;
  }
}

export default GifInstance