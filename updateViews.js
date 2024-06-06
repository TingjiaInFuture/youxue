import fs from 'fs';
import axios from 'axios';

// 读取json文件
let data = JSON.parse(fs.readFileSync('./json/SightsInfo.json', 'utf-8'));

// 设置基址和api
const base_url = 'https://youxueserver-a-wcwgrndlcd.cn-hangzhou.fcapp.run';

// 对每个项调用后端API更新views，score和badScore字段
for(const item of data['item']) {
    let id = item['areaId'];
    let response;
    // 更新views字段
    try {
            response = await axios.put(`${base_url}/area/${id}/updateViews`, { "views": item['views'] });
            if (response.status !== 200) {
                console.log(`更新地区${id}的浏览量失败，错误消息：${response.data.message}`);
            } else {
                console.log("success");
            }
    } catch (error) {
        console.log(error);
    }
    // 更新score字段
    try {
        response = await axios.put(`${base_url}/area/${id}/updateGoods`, { "goods": item['score'] });
            if (response.status !== 200) {
                console.log(`更新地区${id}的点赞量失败，错误消息：${response.data.message}`);
            } else {
                console.log("success");
            }

        } catch (error) {
            console.log(error);
        }
    // 更新badScore字段
        try {
            response = await axios.put(`${base_url}/area/${id}/updateBads`, { "bads": item['badScore'] });
            if (response.status !== 200) {
                console.log(`更新地区${id}的点踩量失败，错误消息：${response.data.message}`);
            } else {
                console.log("success");
            }
        } catch (error) {
            console.log(error);
        }
};