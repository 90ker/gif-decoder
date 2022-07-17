export function byte2bitStr(byte: number) {
  let tmp: string = '';
  for (let i = 7; i >= 0; i--) {
    tmp += (byte & 1 << i) >> i;
  }
  return tmp;
}

