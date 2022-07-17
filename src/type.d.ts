export interface IStream {
  readUint8(): number;
  readUint16(): number;
  slice(offset: number, length: number): Uint8Array;
  setOffset(offset: number): void;
}

export interface ILogicSreenPackageField {
  globalColorTableFlag: number;
  colorResolution: number;
  sortFlag: number;
  globalColorTableSize: number;
}

export interface LogicScreen {
  canvasWidth: number;
  canvasHeight: number;
  packageField: ILogicSreenPackageField;
  bgColorIndex: number;
  pxAspectRadio: number;
}

export interface IGraphPackageField {
  localColorTableFlag: number;
  interlaceFlag: number;
  sortFlag: number;
  unUse: number;
  localColorTableSize: number;
}

export interface IGraphControlPackageField {
  unUse: number;
  disposalMethod: number;
  userInputFlag: number;
  transparentColorFlag: number;
}

export interface GraphControl {
  dataSize: number;
  packageField: IGraphControlPackageField;
  delayTime: number;
  transparentColorIndex: number;
}

export interface ImgScreen {
  left: number;
  right: number;
  width: number;
  height: number;
  packageField: IGraphPackageField;
}

export interface Img {
  imgScreen: ImgScreen;
  localColor: Array<Array<number>>;
  data: Array<number>;
}