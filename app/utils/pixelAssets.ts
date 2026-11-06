// 이벤트 페이지 첫 화면 픽셀아트 어셋(1~10). 어셋1은 PixelTrophy.vue(트로피) 그대로이고, 2~10은 아래 글자 그림으로 그린다.
// 글자 하나 = 칸 하나, '.'은 빈칸, 나머지 글자는 palette의 색. (ADMIN / KTX 같은 파일)
export type PixelArt = { name: string; nameEn: string; palette: Record<string, string>; rows: string[] }

export const PIXEL_ASSET_NAMES: Array<{ id: number; name: string; nameEn: string }> = [
  { id: 1, name: '트로피', nameEn: 'Trophy' },
  { id: 2, name: '금화', nameEn: 'Gold coins' },
  { id: 3, name: '왕관', nameEn: 'Crown' },
  { id: 4, name: '다이아몬드', nameEn: 'Diamond' },
  { id: 5, name: '로켓', nameEn: 'Rocket' },
  { id: 6, name: '선물상자', nameEn: 'Gift box' },
  { id: 7, name: '메달', nameEn: 'Medal' },
  { id: 8, name: '돈주머니', nameEn: 'Money bag' },
  { id: 9, name: '별', nameEn: 'Star' },
  { id: 10, name: '번개', nameEn: 'Lightning' }
]

const K = '#2a1600'
export const PIXEL_ASSETS: Record<number, PixelArt> = {
  2: {
    name: '금화',
    nameEn: 'Gold coins',
    palette: { K, L: '#fff2a8', Y: '#ffd84d', O: '#b86e00', W: '#ffffff' },
    rows: [
      '........KKKKKKK........',
      '......KKLLLLLLLKK......',
      '.....KLLYYYYYYYLLK.....',
      '....KLYYYKKKKKYYYLK....',
      '....KLYYKYYYYYKYYOK....',
      '...KLYYYKYWYYYYYYYOK...',
      '...KLYYYKYYYYYYYYYOK...',
      '...KLYYYKYYYYYYYYYOK...',
      '....KLYYKYYYYYKYYOK....',
      '....KLYYYKKKKKYYYOK....',
      '.....KLYYYYYYYYYOK.....',
      '......KKOOOOOOOKK......',
      '........KKKKKKK........',
      '.......................',
      'KKKKKKKKK.....KKKKKKKKK',
      'KLLLWLLLK.....KLLLWLLLK',
      'KOOOOOOOK.....KOOOOOOOK',
      'KLLLLLLLKKKKKKKLLLLLLLK',
      'KOOOOOOOKLLLLLKOOOOOOOK',
      'KLLLLLLLKOOOOOKLLLLLLLK',
      'KOOOOOOOKLLLLLKOOOOOOOK',
      'KLLLLLLLKOOOOOKLLLLLLLK',
      'KOOOOOOOKLLLLLKOOOOOOOK',
      'KKKKKKKKKKKKKKKKKKKKKKK'
    ]
  },
  3: {
    name: '왕관',
    nameEn: 'Crown',
    palette: { K, Y: '#ffd84d', L: '#fff2a8', O: '#b86e00', R: '#e0314b', B: '#3b82f6', W: '#ffffff' },
    rows: [
      '.K........K........K.',
      'KYK......KYK......KYK',
      '.K.......KYK.......K.',
      '.KK.....KYLYK.....KK.',
      '.KYK....KYLYK....KYK.',
      '.KYYK..KYYLYYK..KYYK.',
      '.KYYYKKYYYYYYYKKYYYK.',
      '.KYYYYYYYYYYYYYYYYYK.',
      '.KYYRYYYYYBYYYYYRYYK.',
      '.KYRRRYYYBBBYYYRRRYK.',
      '.KYYRYYYYYBYYYYYRYYK.',
      '.KYYYYYYYYYYYYYYYYYK.',
      '.KOOOOOOOOOOOOOOOOOK.',
      '.KLWLLLLLLLLLLLLLLLK.',
      '.KOOOOOOOOOOOOOOOOOK.',
      '.KKKKKKKKKKKKKKKKKKK.'
    ]
  },
  4: {
    name: '다이아몬드',
    nameEn: 'Diamond',
    palette: { K: '#0b1a33', W: '#ffffff', L: '#a5f3fc', C: '#22d3ee', D: '#0e7490' },
    rows: [
      '.....KKKKKKKKKKKKK.....',
      '....KWWLLCCWCCLLDDK....',
      '...KWWLLCCCWCCCLLDDK...',
      '..KWLLLCCCCWCCCCLLDDK..',
      '.KKKKKKKKKKKKKKKKKKKKK.',
      'KWWLLLCCCCCWCCCCCLLDDDK',
      '.KWLLLCCCCCWCCCCCLLDDK.',
      '..KWLLCCCCCWCCCCCLDDK..',
      '...KWLLCCCCWCCCCLDDK...',
      '....KWLCCCCWCCCCLDK....',
      '.....KWLCCCWCCCLDK.....',
      '......KLCCCWCCCDK......',
      '.......KLCCWCCDK.......',
      '........KLCWCDK........',
      '.........KLWDK.........',
      '..........KWK..........',
      '...........K...........'
    ]
  },
  5: {
    name: '로켓',
    nameEn: 'Rocket',
    palette: { K: '#111827', R: '#ef4444', W: '#f1f5f9', G: '#94a3b8', B: '#38bdf8', C: '#e0f2fe', O: '#f97316', Y: '#fde047' },
    rows: [
      '.......K.......',
      '......KRK......',
      '.....KRRRK.....',
      '....KRRRRRK....',
      '....KWWWWGK....',
      '....KWKKKGK....',
      '....KKBCBKK....',
      '....KWKKKGK....',
      '....KWWWWGK....',
      '....KWWWWGK....',
      '...KKWWWWGKK...',
      '..KRKWWWWGKRK..',
      '.KRRKWWWWGKRRK.',
      '.KRRKKKKKKKRRK.',
      '.KKK.KOYOK.KKK.',
      '.....KYWYK.....',
      '.....KOYOK.....',
      '......KOK......',
      '.......K.......'
    ]
  },
  6: {
    name: '선물상자',
    nameEn: 'Gift box',
    palette: { K: '#14110f', P: '#ff4d6d', W: '#ffd1dc', G: '#22c55e', L: '#86efac', D: '#15803d' },
    rows: [
      '.....KKK.....KKK.....',
      '....KPPPK...KPPPK....',
      '....KPWPPK.KPPWPK....',
      '.....KPPPKKKPPPK.....',
      '......KKKKPKKKK......',
      '.KKKKKKKKKPKKKKKKKKK.',
      '.KGGGGGGGKPKGGGGGGGK.',
      '.KGLGGGGGKPKGGGGGGDK.',
      '.KKKKKKKKKPKKKKKKKKK.',
      '..KGLGGGGKPKGGGGGDK..',
      '..KGLGGGGKPKGGGGGDK..',
      '..KGLGGGGKPKGGGGGDK..',
      '..KGLGGGGKPKGGGGGDK..',
      '..KGLGGGGKPKGGGGGDK..',
      '..KGGGGGGKPKGGGGGDK..',
      '..KDDDDDDKPKDDDDDDK..',
      '..KKKKKKKKKKKKKKKKK..'
    ]
  },
  7: {
    name: '메달',
    nameEn: 'Medal',
    palette: { K, B: '#2563eb', R: '#ef4444', Y: '#ffd84d', L: '#fff2a8', O: '#b86e00' },
    rows: [
      '..KKKK.....KKKK..',
      '..KBBRK...KRBBK..',
      '...KBBRK.KRBBK...',
      '....KBBRKRBBK....',
      '.....KBBRBBK.....',
      '......KKKKK......',
      '.....KKYYYKK.....',
      '....KYYLLLYYK....',
      '...KYLLYYYOOYK...',
      '..KYLYYYKYYYOYK..',
      '..KYLYYKKYYYOYK..',
      '..KYYYYYKYYYOYK..',
      '..KYYYYYKYYYOYK..',
      '..KYYYYKKKYYOYK..',
      '...KYYYYYYYOOK...',
      '....KYOOOOOOK....',
      '.....KKKKKKK.....'
    ]
  },
  8: {
    name: '돈주머니',
    nameEn: 'Money bag',
    palette: { K: '#2a1a0a', T: '#ef4444', B: '#c8a165', L: '#e8c88a', D: '#8a6430', Y: '#ffd84d' },
    rows: [
      '.......KKKKK.......',
      '........KTK........',
      '.......KTTTK.......',
      '......KKKKKKK......',
      '.....KBBBBBBBK.....',
      '....KBLBBBBBBDK....',
      '...KBLBBBYBBBBDK...',
      '..KBLBBBYYYBBBBDK..',
      '..KBLBBYBYBYBBBDK..',
      '.KBLBBBBYYYBBBBBDK.',
      '.KBLBBBBBYBYBBBBDK.',
      '.KBLBBBBYYYBBBBBDK.',
      '.KBBBBBBBYBBBBBBDK.',
      '.KBBBBBBBBBBBBBBDK.',
      '..KBBBBBBBBBBBBDK..',
      '...KKDDDDDDDDDKK...',
      '.....KKKKKKKKK.....'
    ]
  },
  9: {
    name: '별',
    nameEn: 'Star',
    palette: { K, Y: '#ffd84d', L: '#fff2a8', O: '#f0b90b' },
    rows: [
      '..........K..........',
      '.........KYK.........',
      '.........KYK.........',
      '........KYLYK........',
      '........KYLYK........',
      'KKKKKKKKKYLYKKKKKKKKK',
      '.KYYYYYYYYLYYYYYYYOK.',
      '..KYYYLLLLLLLLYYYOK..',
      '...KYYYYYYYYYYYYOK...',
      '....KYYYYYYYYYYOK....',
      '.....KYYYYYYYYOK.....',
      '.....KYYYYYYYYOK.....',
      '....KYYYYYOYYYYOK....',
      '....KYYYYKKKYYYOK....',
      '...KYYYKK...KKYOK....',
      '...KYKK.......KKOK...',
      '..KKK...........KKK..'
    ]
  },
  10: {
    name: '번개',
    nameEn: 'Lightning',
    palette: { K: '#1f1300', Y: '#ffd84d', L: '#fff7c2', O: '#f59e0b' },
    rows: [
      '......KKKKKKK..',
      '.....KLYYYYK...',
      '.....KLYYOK....',
      '....KLYYOK.....',
      '....KLYOK......',
      '...KLYYYOKKKK..',
      '...KLYYYYYYOK..',
      '..KKKKKLYYOK...',
      '......KLYOK....',
      '.....KLYOK.....',
      '.....KLOK......',
      '....KLOK.......',
      '....KYK........',
      '...KYK.........',
      '...KK..........'
    ]
  }
}

// 같은 색이 가로로 이어진 칸을 한 번에 그리는 path 목록(색마다 하나)
export function pixelArtPaths(art: PixelArt) {
  const width = Math.max(...art.rows.map((r) => r.length))
  const byColor = new Map<string, string>()
  art.rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]!
      if (ch === '.' || !art.palette[ch]) {
        x++
        continue
      }
      let n = 1
      while (row[x + n] === ch) n++
      byColor.set(ch, (byColor.get(ch) || '') + `M${x} ${y}h${n}v1h-${n}z`)
      x += n
    }
  })
  return {
    width,
    height: art.rows.length,
    paths: Array.from(byColor.entries()).map(([ch, d]) => ({ fill: art.palette[ch]!, d }))
  }
}
