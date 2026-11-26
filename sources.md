# 数据与素材来源

调查日期：2026-11-26。本项目选择 **路线 B：Vite + Three.js 原创重建**，不是实景扫描，不使用商业地图瓦片、卫星图、纹理或模型。

## 校区定位与坐标

- 搜索时用指定宿舍名称排除其他校区；该名称不会出现在作品、地点卡、默认出生点或公开说明中，也不作为团队住址标注。
- OpenStreetMap Nominatim 返回目标为 **南京工业大学（江浦校区）**，relation **15927775**：https://www.openstreetmap.org/relation/15927775
- 原始类型：`amenity=university` 关系及校园建筑、道路、水体、运动场等矢量地物。不是卫星影像、地形高程或实景三维网格。
- 原始坐标系：OSM 使用 WGS84 经纬度。项目仅以单一公式转为局部米制坐标，未混入 GCJ-02。
- Nominatim 查询结果原点：118.6361144, 32.0839058（WGS84）。这是校区关系的参考点，不是宿舍楼或团队住址。
- 2026-11-26 通过 Overpass 获取并保留原始响应 `data/campus-osm.json`；处理后得到 98 个边界点、173 个校园建筑轮廓、207 段道路及水体/运动场。OSM 是众包数据，仍需实地核对。

## 开放数据许可

- OpenStreetMap 版权与许可：https://www.openstreetmap.org/copyright
- 许可证：ODbL 1.0。允许复制、分发与改编，须署名 “© OpenStreetMap contributors”，派生数据库按相同许可共享并链接许可。
- 页面右下角持续显示署名与许可链接；处理脚本和 `src/data/campus.json` 保留来源、日期和坐标转换说明。
- OSM 版权页同时说明不能把 Google 等受版权保护来源直接加入 OSM；本项目没有从商业地图描摹或重新打包数据。

## 实景三维调查与路线决定

### Google Photorealistic 3D Tiles / Map Tiles API

- 数据类型说明：https://developers.google.com/maps/documentation/tile/3d-tiles-overview?hl=zh-cn
- 覆盖表：https://developers.google.com/maps/coverage.md.txt#countryregion-coverage
- 接入说明：https://developers.google.cn/maps/documentation/tile/3d-tiles?hl=zh-cn
- 这是实景三维网格（OGC 3D Tiles），不同于卫星影像、建筑轮廓或地形高程。
- 接入需要 Map Tiles API、API 密钥及相应账号/计费配置，渲染器必须显示数据提供方署名；本项目没有获得或提交私密密钥。
- 2026-11-26 覆盖表的 CN 行没有其他国家所示的明确 2D / 3D 双项覆盖标记，且国家表不能证明江浦校区建筑级覆盖。
- **未完成的验证**：没有可用授权密钥，未能检查校区俯瞰、建筑近景、两个已知地标的套合、配额及公众稳定访问。因此不能确认覆盖、授权和公开访问，未采用该服务。

### Cesium ion

- 服务介绍：https://cesium.com/learn/photorealistic-3d-tiles-learn/
- Google 实景三维可通过 Cesium ion 账号提供，但仍受 Google 条款、账号和配额约束。未找到无需账号、明确覆盖江浦校区且允许本作品公开访问的校区实景网格。
- Cesium World Terrain / OSM Buildings 是地形或建筑体量，不等于江浦校区实景三维网格，不把它们宣称为实景扫描。

结论：覆盖、授权和无私密密钥的公开访问不能同时确认，按任务要求只维护 **Three.js 原创重建** 一条路线。

## 官方事实

### 逸夫图书馆

- 南京工业大学图书馆《本馆简介》：https://lib.njtech.edu.cn/gk/bgjj.htm
- 官方确认：江浦校区逸夫图书馆于 2006 年 9 月落成；有借阅室、电子阅览室、多媒体教室、会议室、研究室和多功能报告厅，提供书刊借阅、电子资源检索等服务。
- OSM way 1177289252 提供建筑轮廓与名称。默认出生点在其外侧公共区域上空，不在任何宿舍楼旁。
- 未确认：当前社会访客入校政策、建筑入口、开放时间和精确实测楼高。作品不写猜测值。

### 天宝阁

- 建筑学院历史校门复建介绍：https://arch.njtech.edu.cn/info/1069/3064.htm
- 校方转载介绍：https://cqt.njtech.edu.cn/info/1015/37569.htm
- 官方确认：校史塔“天宝阁”位于复建老校门中轴线向北方向，是校园历史文化景观。当前能否登塔未知，不宣传登塔或开放时间。
- 位置核对：Commons 照片含 WGS84 GPS 元数据，但 GPS 可能代表拍摄机位而非塔身，不能直接当作建筑坐标；仅在 OSM 独立对象或实地资料支持时放置精细模型。

### 厚学楼

- 名称与轮廓来自 OSM ways 1177919027 / 1177919028；开放照片素材页明确标注为江浦校区厚学楼。
- 未确认：当前入口、开放时间、实测楼高。

### 行健体育场、沉毅广场与老校门

- 行健体育场运动会：https://tw.njtech.edu.cn/info/1017/54184.htm
- 沉毅广场活动：https://www.njtech.edu.cn/info/1059/12826348.htm
- 原南京建筑工程学院 1954 年校门复建：https://arch.njtech.edu.cn/info/1069/3064.htm
- 官方只支持公共活动、体育和校史文化等用途。未取得精确对象坐标或开放许可照片的地点，不编造入口或位置。

## 已确认可复用照片

以下文件逐页确认 Own work、作者和许可；项目只进行尺寸压缩/网页裁切，未进行内容修改。网页地点卡显示作者、素材页和许可链接。

1. **逸夫图书馆**
   - 素材页：https://commons.wikimedia.org/wiki/File:%E5%8D%97%E5%B7%A5%E5%A4%A7%E5%9B%BE%E4%B9%A6%E9%A6%861.jpg
   - 作者：Ralfno7；日期：2014-02-03；许可：CC BY-SA 3.0
   - 许可：https://creativecommons.org/licenses/by-sa/3.0/
   - 本地文件：`public/assets/library.jpg`。照片较早，地点卡提示现状可能变化。
2. **天宝阁**
   - 素材页：https://commons.wikimedia.org/wiki/File:%E5%8D%97%E5%B7%A5%E5%A4%A7%E6%B1%9F%E6%B5%A6%E6%A0%A1%E5%8C%BA%E5%A4%A9%E5%AE%9D%E9%98%81.jpg
   - 作者：Antigng；日期：2018-07-19；许可：CC BY-SA 4.0
   - 许可：https://creativecommons.org/licenses/by-sa/4.0/
   - 本地文件：`public/assets/tianbaoge.jpg`。
3. **厚学楼**
   - 素材页：https://commons.wikimedia.org/wiki/File:Houxue_Building,_Nanjing_Tech_University_Jiangpu_Campus.jpg
   - 作者：Leiem；日期：2018-06-02；许可：CC BY-SA 4.0
   - 许可：https://creativecommons.org/licenses/by-sa/4.0/
   - 本地文件：`public/assets/houxue.jpg`。
4. **镜湖**
   - 素材页：https://commons.wikimedia.org/wiki/File:%E5%8D%97%E5%B7%A5%E5%A4%A7%E6%B1%9F%E6%B5%A6%E6%A0%A1%E5%8C%BA%E9%95%9C%E6%B9%96.jpg
   - 作者：Antigng；日期：2018-07-19；许可：CC BY-SA 4.0
   - 许可：https://creativecommons.org/licenses/by-sa/4.0/
   - 本地文件：`public/assets/jinghu.jpg`。照片仅作水面、喷泉与植被参考；季节现状和公共步道仍以现场为准。

## 推定与仍缺资料

- 建筑轮廓、道路和水体位置来自 OSM；无 `height` / `building:levels` 的楼体使用统一风格化高度，仅用于视觉体量，不是实测数据。
- 图书馆细部是依据开放照片做的原创近似重建，不是摄影测量；植被、步道材质和远处细节为原创概括。
- 当前最需要团队补充：与三维视角相近的图书馆入口近景、入口标识、厚学楼入口、镜湖公共步道照片，以及队员亲自推荐地点的一句话理由。未获得前，相关字段保持“未核实”或“团队推荐候选”。
- 团队推荐候选暂选镜湖；这是 Qoder 的候选建议，未冒充两位队员已实地推荐，公开参赛前需队员确认。
- 不展示宿舍内部，不推断当前校门开放安排。历史开放公告只作调查证据，不作为当前规则。
