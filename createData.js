import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';

// 八大菜系及其美食
const cuisines = {
    "川菜": ["麻婆豆腐", "宫保鸡丁", "鱼香肉丝", "回锅肉", "水煮鱼"],
    "鲁菜": ["糖醋鲤鱼", "九转大肠", "德州扒鸡", "葱烧海参", "扒三样"],
    "淮扬菜": ["扬州炒饭", "狮子头", "软兜长鱼", "大煮干丝", "文思豆腐"],
    "粤菜": ["叉烧包", "虾饺", "豉汁蒸凤爪", "广式烧鸭", "白切鸡"],
    "浙江菜": ["西湖醋鱼", "龙井虾仁", "东坡肉", "叫花鸡", "宋嫂鱼羹"],
    "闽菜": ["佛跳墙", "荔枝肉", "蚵仔煎", "太极芋泥", "红糟鸡"],
    "湘菜": ["剁椒鱼头", "辣子鸡", "湘西外婆菜", "毛氏红烧肉", "腊味合蒸"],
    "徽菜": ["臭鳜鱼", "毛豆腐", "火腿炖甲鱼", "徽州圆子", "栗子鸡"]
};

// 真实的热门景点和学校名称
const locations = [
    "八达岭－慕田峪长城旅游区",
    "奥林匹克公园",
    "明十三陵景区",
    "圆明园景区",
    "天坛公园",
    "恭王府景区",
    "故宫博物院",
    "颐和园景区",
    "天津古文化街旅游区（津门故里）",
    "盘山风景名胜区",
    "保定市安新白洋淀景区",
    "唐山市清东陵景区",
    "承德避暑山庄及周围寺庙景区",
    "通化市高句丽文物古迹旅游景区",
    "长春市世界雕塑公园旅游景区",
    "长春净月潭景区",
    "敦化市六鼎山文化旅游区",
    "长春市伪满皇宫博物院",
    "伊春市汤旺河林海奇石景区",
    "哈尔滨市太阳岛景区",
    "漠河北极村旅游区",
    "上海东方明珠广播电视塔",
    "上海科技馆",
    "上海野生动物园",
    "上海市中国共产党一大·二大·四大纪念馆景区",
    "南京市夫子庙-秦淮风光带景区",
    "南京市钟山风景名胜区-中山陵园风景区",
    "嘉兴市桐乡乌镇古镇旅游区",
    "宁波市奉化溪口-滕头旅游景区",
    "杭州市千岛湖风景名胜区",
    "杭州市西湖风景名胜区",
    "丽水市缙云仙都景区",
    "嘉兴市南湖旅游区",
    "嘉兴市西塘古镇旅游景区",
    "宁波市天一阁·月湖景区",
    "杭州西溪湿地旅游区",
    "温州市刘伯温故里景区",
    "绍兴市鲁迅故里沈园景区",
    "南平市武夷山风景名胜区",
    "福建土楼（永定·南靖）",
    "厦门市鼓浪屿风景名胜区",
    "张家界武陵源—天门山旅游区",
    "岳阳市岳阳楼—君山岛景区",
    "常德市桃花源旅游区",
    "株洲市炎帝陵景区",
    "湘潭市韶山旅游区",
    "长沙市岳麓山·橘子洲旅游区",
    "衡阳市南岳衡山旅游区",
    "中山市孙中山故里旅游区",
    "广州市白云山风景区",
    "惠州市惠州西湖旅游景区",
    "江门市开平碉楼文化旅游区",
    "清远市连州地下河旅游景区",
    "肇庆市星湖旅游景区",
    "韶关市丹霞山景区",
    "广州市长隆旅游度假区",
    "惠州市罗浮山景区",
    "梅州市雁南飞茶田景区",
    "深圳华侨城旅游度假区",
    "深圳市观澜湖休闲旅游区",
    "桂林市两江四湖·象山景区",
    "桂林市乐满地度假世界",
    "桂林市漓江景区",
    "桂林市独秀峰-王城景区",
    "三亚市蜈支洲岛旅游区",
    "三亚市南山大小洞天旅游区",
    "三亚市南山文化旅游区",
    "乐山市乐山大佛景区",
    "乐山市峨眉山景区",
    "南充市阆中古城旅游区",
    "南充市仪陇朱德故里景区",
    "巴中市光雾山旅游景区",
    "甘孜州海螺沟景区",
    "甘孜州稻城亚丁旅游景区",
    "中国科学院西双版纳热带植物园",
    "丽江市丽江古城景区",
    "丽江市玉龙雪山景区",
    "拉萨市大昭寺",
    "拉萨布达拉宫景区",
    "商洛市金丝峡景区",
    "宝鸡市法门寺佛文化景区",
    "延安市黄帝陵景区",
    "西安市华清池景区",
    "西安市秦始皇兵马俑博物馆",
    "渭南市华山景区",
    "宝鸡市太白山旅游景区",
    "延安市延安革命纪念地景区",
    "西安市城墙·碑林历史文化景区",
    "西安市大明宫旅游景区",
    "西安大雁塔·大唐芙蓉园景区",
    "黄河壶口瀑布旅游区",
    "乌鲁木齐天山大峡谷景区",
    "吐鲁番市葡萄沟风景区",
    "喀什地区喀什噶尔老城景区",
    "喀什地区泽普金湖杨景区",
    "巴音郭楞蒙古自治州博斯腾湖景区",
    "伊犁那拉提旅游风景区",
    "天山天池风景名胜区"
];

const schools = [
    "北京大学",
    "中国人民大学",
    "清华大学",
    "北京交通大学",
    "北京工业大学",
    "北京航空航天大学",
    "北京理工大学",
    "北京科技大学",
    "北方工业大学",
    "北京化工大学",
    "北京工商大学",
    "北京邮电大学",
    "北京印刷学院",
    "北京建筑大学",
    "北京石油化工学院",
    "北京电子科技学院",
    "首都体育学院",
    "中国传媒大学",
    "复旦大学",
    "同济大学",
    "上海交通大学",
    "华东理工大学",
    "中山大学",
    "暨南大学",
    "华南理工大学",
    "华南农业大学",
    "广州医科大学",
    "广州中医药大学",
    "广东药科大学",
    "华南师范大学",
    "深圳大学",
    "南方科技大学",
    "深圳技术大学",
    "香港中文大学（深圳）",
    "四川大学",
    "西南交通大学",
    "电子科技大学",
    "西南石油大学",
    "南京大学",
    "东南大学",
    "南京航空航天大学",
    "南京理工大学",
    "南京工业大学",
    "南京邮电大学",
    "重庆大学",
    "重庆邮电大学",
    "重庆交通大学",
    "重庆医科大学",
    "西南大学",
    "重庆师范大学",
    "厦门大学",
    "黑龙江大学",
    "哈尔滨工业大学",
    "哈尔滨理工大学",
    "哈尔滨工程大学",
    "西北大学",
    "西安交通大学",
    "西北工业大学",
    "西安理工大学",
    "西安电子科技大学",
    "中国海洋大学",
    "山东科技大学",
    "中国石油大学（华东）",
    "青岛大学",
    "山东大学",
    "济南大学",
    "山东建筑大学",
    "齐鲁工业大学",
    "山东第一医科大学",
    "山东中医药大学",
    "山东师范大学",
    "山东财经大学",
    "浙江大学",
    "杭州电子科技大学",
    "浙江工业大学",
    "浙江理工大学",
    "浙江农林大学",
    "浙江中医药大学",
    "杭州师范大学",
    "浙江工商大学",
    "中国美术学院",
    "中国计量大学",
    "云南大学",
    "昆明理工大学",
    "云南农业大学",
    "西南林业大学",
    "昆明医科大学",
    "云南中医药大学",
    "云南师范大学",
    "云南财经大学",
    "云南民族大学",
    "兰州大学",
    "兰州理工大学",
    "兰州交通大学",
    "甘肃农业大学",
    "甘肃中医药大学",
    "西北师范大学",
    "兰州财经大学",
    "西北民族大学",
    "新疆大学",
    "内蒙古大学",
    "安徽大学",
    "中国科学技术大学",
    "合肥工业大学",
    "安徽农业大学",
    "武汉大学",
    "华中科技大学",
    "武汉科技大学",
    "武汉工程大学",
    "中国地质大学（武汉）"
];

async function fetchImageUrl(query) {
    const url = `https://www.bing.com/images/search?q=${query}`;
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const imageUrl = $('img').eq(1).attr('src'); // 获取第二张图片的 URL
        return imageUrl || '';
    } catch (error) {
        console.error(`Error fetching image for ${query}:`, error);
        return '';
    }
}

async function createFoodData() {
    const allLocations = [...locations, ...schools];
    const foodData = [];

    for (const location of allLocations) {
        const locationData = {
            name: location,
            dishes: []
        };

        for (const [cuisine, dishes] of Object.entries(cuisines)) {
            for (const dish of dishes) {
                const popularity = Math.floor(Math.random() * 51) + 50;
                const distance = Math.floor(Math.random() * 2901) + 100;
                const rating = (Math.random() * 5).toFixed(1);
                const restaurant = `饭店${Math.floor(Math.random() * 3) + 1}`;
                const image = await fetchImageUrl(dish);

                locationData.dishes.push({
                    name: dish,
                    popularity,
                    cuisine,
                    distance,
                    rating,
                    restaurant,
                    image
                });
            }
        }

        foodData.push(locationData);
        console.log("success!");
    }

    fs.writeFileSync('foodData.js', `const foodData = ${JSON.stringify(foodData, null, 2)};`);
    console.log('foodData.js 文件已生成');
}

createFoodData().catch(console.error);