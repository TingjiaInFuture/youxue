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
    "长城", "故宫", "颐和园", "天安门广场", "兵马俑", "黄山", "丽江古城", "张家界",
    "九寨沟", "峨眉山", "布达拉宫", "苏州园林", "桂林山水", "杭州西湖", "敦煌莫高窟",
    "东方明珠", "外滩", "南京路步行街", "上海迪士尼乐园", "杭州宋城", "厦门鼓浪屿", 
    "北京颐和园", "成都宽窄巷子", "西安钟鼓楼", "哈尔滨冰雪大世界", "青岛栈桥", 
    "重庆洪崖洞", "武汉黄鹤楼", "南京中山陵", "天津滨海新区", "长沙橘子洲头",
    "海口五公祠", "三亚亚龙湾", "昆明滇池", "桂林阳朔", "深圳华侨城", "广州塔",
    "珠海长隆海洋王国", "深圳大梅沙", "汕头南澳岛", "佛山南海", "东莞可园", 
    "惠州西湖", "中山孙中山故居", "江门开平碉楼", "珠海圆明新园", "汕尾玄武山",
    "湛江南三岛", "韶关丹霞山", "梅州雁南飞", "清远飞来湖", "阳江海陵岛", 
    "河源龙川", "茂名水东湾", "肇庆七星岩", "潮州广济桥", "揭阳普宁", "云浮新兴温泉",
    "绍兴鲁迅故里", "宁波东钱湖", "温州楠溪江", "嘉兴南湖", "台州仙居", 
    "金华双龙洞", "舟山普陀山", "湖州南浔古镇", "丽水缙云仙都", "衢州江郎山",
    "杭州千岛湖", "绍兴东湖", "宁波慈溪", "温州洞头", "嘉兴西塘", "台州玉环", 
    "金华武义温泉", "舟山朱家尖", "湖州安吉竹海", "丽水云和梯田", "衢州龙游石窟",
    "杭州临安", "绍兴柯岩", "宁波北仑", "温州平阳", "嘉兴海宁", "台州温岭", 
    "金华永康", "舟山沈家门", "湖州长兴", "丽水庆元", "衢州开化", "杭州萧山", 
    "绍兴诸暨", "宁波象山", "温州苍南", "嘉兴嘉善", "台州天台", "金华磐安", 
    "舟山桃花岛", "湖州德清", "丽水龙泉", "衢州常山", "杭州桐庐", "绍兴上虞", 
    "宁波鄞州", "温州文成", "嘉兴秀洲", "台州黄岩", "金华兰溪", "舟山岱山", 
    "湖州吴兴", "丽水松阳", "衢州江山", "杭州余杭", "绍兴嵊州", "宁波奉化", 
    "温州瑞安", "嘉兴平湖", "台州路桥", "金华义乌", "舟山嵊泗", "湖州南浔", 
    "丽水景宁", "衢州柯城", "杭州富阳", "绍兴越城", "宁波镇海", "温州瓯海",
    "嘉兴南湖", "台州椒江", "金华东阳", "舟山普陀", "湖州长兴", "丽水缙云", 
    "衢州柯城"
];

const schools = [
    "北京大学", "清华大学", "复旦大学", "上海交通大学", "浙江大学", "南京大学",
    "武汉大学", "中山大学", "哈尔滨工业大学", "北京师范大学", "南开大学",
    "同济大学", "中国人民大学", "华中科技大学", "四川大学", "山东大学",
    "厦门大学", "吉林大学", "西安交通大学", "东南大学", "天津大学",
    "北京航空航天大学", "华南理工大学", "大连理工大学", "中国农业大学",
    "重庆大学", "中国科学技术大学", "电子科技大学", "北京理工大学",
    "西北工业大学", "南京航空航天大学", "北京科技大学", "东北大学",
    "中国地质大学", "北京邮电大学", "华东师范大学", "兰州大学", 
    "湖南大学", "华中师范大学", "东北师范大学", "南京理工大学",
    "东华大学", "西南交通大学", "西南财经大学", "中国政法大学",
    "中南财经政法大学", "中央财经大学", "西北大学", "中国矿业大学"
];

async function fetchImageUrl(query) {
    const url = `https://www.google.com/search?hl=en&tbm=isch&q=${query}`;
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
    }

    fs.writeFileSync('foodData.js', `const foodData = ${JSON.stringify(foodData, null, 2)};`);
    console.log('foodData.js 文件已生成');
}

createFoodData().catch(console.error);
