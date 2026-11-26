import campus from './campus.json';

const library = campus.buildings.find((building) => building.name === '逸夫图书馆');
const houxueParts = campus.buildings.filter((building) => building.name === '厚学楼');
const houxue = houxueParts.reduce((acc, building) => ({
  x: acc.x + building.center[0] / houxueParts.length,
  z: acc.z + building.center[1] / houxueParts.length,
}), { x: 0, z: 0 });
const jinghu = campus.waters.find((water) => water.name === '镜湖');

export const places = [
  {
    id: 'library',
    name: '逸夫图书馆',
    english: 'Yifu Library',
    category: '校园地标 · CAMPUS LANDMARK',
    position: [library.center[0], 18, library.center[1]],
    approach: [library.center[0] + 76, 38, library.center[1] + 118],
    photo: '/assets/library.jpg',
    photoAlt: '从台阶方向看逸夫图书馆的玻璃立面、立柱与馆名',
    author: 'Ralfno7',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:%E5%8D%97%E5%B7%A5%E5%A4%A7%E5%9B%BE%E4%B9%A6%E9%A6%861.jpg',
    description: '2006 年 9 月落成。这里不只是自习空间，也有书刊借阅、电子资源检索、多媒体教室和学术报告空间。从空中记住白色横向体量与大片玻璃立面，再到现实里寻找台阶旁的馆名。',
    descriptionEn: 'Completed in September 2006, Yifu Library brings together book lending, digital resources, multimedia teaching and academic events. Recognise its white horizontal volumes and glass fins from the air, then look for the name beside the steps on the ground.',
    access: '入口未核实：不猜测具体门的位置。请从公共步道接近，并以现场标识和学校最新规定为准。',
    accessEn: 'Entrance unverified: follow on-site signs and current university rules rather than this reconstruction.',
    note: '照片：2014-02-03，现状可能变化。三维立面依据照片原创近似建模，非实景扫描；楼高与入口未实测。',
  },
  {
    id: 'houxue',
    name: '厚学楼',
    english: 'Houxue Building',
    category: '教学建筑 · TEACHING BUILDING',
    position: [houxue.x, 18, houxue.z],
    approach: [houxue.x + 20, 40, houxue.z + 116],
    photo: '/assets/houxue.jpg',
    photoAlt: '厚学楼白色窗格立面与楼前公共空间',
    author: 'Leiem',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Houxue_Building,_Nanjing_Tech_University_Jiangpu_Campus.jpg',
    description: '厚学楼是 OSM 校园数据中明确标注的教学建筑。照片里的白色竖向窗格、浅色墙裙和楼前开放空间，是从空中体量转到地面视角时可以留意的特征。',
    descriptionEn: 'Houxue is a named teaching building in the OpenStreetMap campus data. From the air, follow its footprint; on the ground, look for the white vertical window grid, pale base and open forecourt shown in the reference photo.',
    access: '入口与开放时间未核实。照片拍摄于考试活动期间，其中人群和临时横幅不是常态，也不作为通行依据。',
    accessEn: 'Entrance and opening hours are unverified. The photo shows an examination event; its crowd and temporary banner do not indicate normal access.',
    note: '照片：2018-06-02。三维只重建公开轮廓与概括立面，未展示楼内空间。',
  },
  {
    id: 'jinghu',
    name: '镜湖',
    english: 'Jinghu Lake',
    category: '团队推荐候选 · TEAM PICK CANDIDATE',
    position: [jinghu.center[0], 5, jinghu.center[1]],
    approach: [jinghu.center[0] + 55, 30, jinghu.center[1] + 105],
    photo: '/assets/jinghu.jpg',
    photoAlt: '镜湖水面、喷泉、荷叶与岸边树木',
    author: 'Antigng',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:%E5%8D%97%E5%B7%A5%E5%A4%A7%E6%B1%9F%E6%B5%A6%E6%A0%A1%E5%8C%BA%E9%95%9C%E6%B9%96.jpg',
    description: '从建筑之间飞向水面，用喷泉、荷叶和岸线重新定位自己。这里是 Qoder 建议的“校园好去处”候选，等待两位队员实地散步后补上自己的推荐理由。',
    descriptionEn: 'Leave the building grid and use the fountain, lotus leaves and shoreline to reorient yourself. This is Qoder’s candidate for a team favourite, pending the two students’ own on-campus visit and recommendation.',
    access: '不指定未经核实的入口或环湖路线；请使用现场公共步道，不进入水中或封闭区域。',
    accessEn: 'No unverified entrance or lakeside route is suggested. Use public paths and stay out of the water and closed areas.',
    note: '照片：2018-07-19。喷泉与植被按照片做风格化提示，水位、植物和开放状态可能随季节变化。',
  },
];

export const start = {
  position: [library.center[0] + 120, 58, library.center[1] + 175],
  target: [library.center[0], 16, library.center[1]],
};
