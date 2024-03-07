const fs = require("fs");
const dbFile = `youxue.db`;
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
let db;
dbWrapper
  .open({
    filename: dbFile,
    driver: sqlite3.Database
  })
  .then(async dBase => {
    db = dBase;

    try {
      if (!exists) {
          await db.run(`
              CREATE TABLE Users (
                  id INTEGER PRIMARY KEY AUTOINCREMENT, 
                  username TEXT, 
                  password TEXT
              )
          `);
          await db.run(`
              CREATE TABLE StudyTourDiaries (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  diary TEXT,
                  authorId INTEGER,
                  viewCount INTEGER DEFAULT 0,
                  rating REAL DEFAULT 0,
                  ratingCount INTEGER DEFAULT 0,
                  FOREIGN KEY(authorId) REFERENCES Users(id)
              )
          `);
      }
  } catch (error) {
      console.error(error);
  }
  
  });

// Check if a username is already taken
const checkUsername = async (username) => {
  let userId = 0;
  try {
    const user = await db.get("SELECT * FROM Users WHERE username = ?", username);
    userId = user ? user.id : 0;
  } catch (dbError) {
    console.error(dbError);
  }
  return userId;
};

module.exports = {
  checkUsername,

  // Add new user
  addUser: async (username, password) => {
    let userId = 0;
    try {
      // 检查用户名是否已存在
      userId = await checkUsername(username);
      if (!userId) {
        const result = await db.run("INSERT INTO Users (username, password) VALUES (?, ?)", [
          username,
          password
        ]);
        if (result.changes > 0) {
          // 获取新插入的用户的 id
          const user = await db.get("SELECT last_insert_rowid() as id");
          userId = user.id;
        }
      }
    } catch (dbError) {
      console.error(dbError);
    }
    return userId;
  },





  // 登录验证
  login: async (username, password) => {
    let userId = 0;
    try {
      const user = await db.get("SELECT * FROM Users WHERE username = ? AND password = ?", username, password);
      if (user) {
        userId = user.id;
      }
    } catch (dbError) {
      console.error(dbError);
    }
    return userId;
  },



  // 获取游记列表 
  getDiaries: async () => {
    let diaries = [];
    try {
      diaries = await db.all("SELECT * FROM StudyTourDiaries");
    } catch (dbError) {
      console.error(dbError);
    }
    return diaries;
  },

  // 评分
  rateDiary: async (diaryId, rating) => {
    try {
      const result = await db.run("UPDATE StudyTourDiaries SET rating = (rating * ratingCount + ?) / (ratingCount + 1), ratingCount = ratingCount + 1 WHERE id = ?", rating, diaryId);
      if (result.changes > 0) {
        return true;
      }
    } catch (dbError) {
      console.error(dbError);
    }
    return false;
  },

 //上传游学日记
  addDiary: async (diary, authorId) => {
    let diaryId = 0;
    try {
      const result = await db.run("INSERT INTO StudyTourDiaries (diary, authorId) VALUES (?, ?)", diary, authorId);
      if (result.changes > 0) {
        // 获取新插入的游记的 id
        const newDiary = await db.get("SELECT last_insert_rowid() as id");
        diaryId = newDiary.id;
      }
    } catch (dbError) {
      console.error(dbError);
    }
    return diaryId;
  },

  // 浏览次数
  viewDiary: async (diaryId) => {
    try {
      const result = await db.run("UPDATE StudyTourDiaries SET viewCount = viewCount + 1 WHERE id = ?", diaryId);
      if (result.changes > 0) {
        return true;
      }
    } catch (dbError) {
      console.error(dbError);
    }
    return false;
  },

  // 获取推荐的游学日记列表
getRecommendedDiaries: async () => {
  let diaries = [];
  try {
    diaries = await db.all("SELECT * FROM StudyTourDiaries");
  } catch (dbError) {
    console.error(dbError);
  }

  // 使用冒泡排序算法对游学日记进行排序
  for (let i = 0; i < diaries.length - 1; i++) {
    for (let j = 0; j < diaries.length - 1 - i; j++) {
      if (diaries[j].viewCount < diaries[j + 1].viewCount || 
          (diaries[j].viewCount === diaries[j + 1].viewCount && diaries[j].rating < diaries[j + 1].rating)) {
        let temp = diaries[j];
        diaries[j] = diaries[j + 1];
        diaries[j + 1] = temp;
      }
    }
  }

  return diaries;
}


  

};
