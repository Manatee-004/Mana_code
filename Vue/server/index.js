const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const port = 5000;
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const app = express();

// 基础中间件
// app.use(cors());
// app.use(cors({
//   origin: 'http://localhost:5173', // 你的前端地址
//   credentials: true
// }));
app.use(cors({
  origin: 'http://localhost:5173', // 前端地址
  credentials: true, // 允许携带凭证（如 Cookie）
  methods: 'GET,POST,PUT,DELETE',
  optionsSuccessStatus: 200
}));

// 允许跨域请求（如果前端和后端不在同一个域名下）
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//     next();
// });

// JSON解析
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// 4. 文件上传中间件配置
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  abortOnLimit: true
}));

//静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// 创建 MySQL 连接池
const pool = mysql.createPool({
  host: 'localhost', // 数据库主机
  user: 'root', // 数据库用户名
  port: 3308, // MySQL 端口
  password: 'Manatee004', // 数据库密码
  database: 'student_plan_dis', // 数据库名称
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


// 测试数据库连接
pool.getConnection((err, connection) => {
  if (err) {
    console.error('数据库连接失败:', err);
    return;
  }
  console.log('数据库连接成功');
  connection.release();
});

// 获取所有用户信息
app.get('/api/users', (req, res) => {
    pool.query('SELECT * FROM user_table', (err, results) => {
      if (err) {
        console.error('查询失败:', err);
        return;
      }
    });
});

// 登录功能
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  
  pool.query(
    'SELECT * FROM user_table WHERE name = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: '查询失败' });
      }
      
      if (results.length === 0) {
        return res.status(401).json({ success: false, message: '用户名或密码错误' });
      }
      
      // 检查用户是否被封禁
      if (results[0].is_banned) {
        return res.status(403).json({ 
          success: false, 
          message: '您的账号已被封禁，请联系管理员' 
        });
      }
      
      res.status(200).json({ success: true, user: results[0] });
    }
  );
});


// 注册功能
app.post('/api/register', (req, res) => {
  const { username, password } = req.body; // 从请求体中获取用户名和密码
  // 检查用户名和密码是否为空
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  // 检查用户名是否已存在
  pool.query(
    'SELECT * FROM user_table WHERE name = ?',
    [username],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: '查询失败' });
      }
      // 如果用户名已存在
      if (results.length > 0) {
        return res.status(409).json({ success: false, message: '用户名已存在' });
      }
      // 插入新用户
      pool.query(
        'INSERT INTO user_table (name, password, profile, email) VALUES (?, ?,NULL,NULL)',
        [username, password],
        (err, results) => {
          if (err) {
            return res.status(500).json({ success: false, message: '注册失败' });
          }
          // 注册成功
          res.status(200).json({ success: true, message: '注册成功' });
        }
      );
    }
  );
});

// 获取用户信息
app.get('/api/profile', (req, res) => {
  const username = req.query.username; // 从查询参数中获取用户名
  // 检查用户名是否为空
  if (!username) {
    return res.status(400).json({ success: false, message: '用户名不能为空' });
  }
  // 查询用户信息
  pool.query(
    `SELECT 
      name, 
      password, 
      profile, 
      email, 
      DATE_FORMAT(createdate, '%Y-%m-%d %H:%i:%s') AS createdate, 
      DATE_FORMAT(updatedate, '%Y-%m-%d %H:%i:%s') AS updatedate 
    FROM user_table 
    WHERE name = ?`,
    [username],
    (err, results) => {
      if (err) {
        console.error('查询失败:', err); // 打印详细的错误信息
        return res.status(500).json({ success: false, message: '查询失败' });
      }
      // 检查查询结果是否为空
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: '用户未找到' });
      }
      res.status(200).json({ success: true, user: results[0] });
    }
  );
});

// 更新用户信息
app.put('/api/updateprofile', (req, res) => {
  const { username, newUsername, email, profile } = req.body;
  // 检查必要字段是否为空
  if (!username || !newUsername || !email || !profile) {
    return res.status(400).json({ success: false, message: '所有字段不能为空' });
  }
  // 检查新用户名是否已存在
  pool.query(
    'SELECT * FROM user_table WHERE name = ?',
    [newUsername],
    (err, results) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ success: false, message: '查询失败' });
      }

      // 如果新用户名已存在且不是当前用户
      if (results.length > 0 && results[0].name !== username) {
        return res.status(409).json({ success: false, message: '用户名已存在' });
      }

      // 更新用户信息
      pool.query(
        'UPDATE user_table SET name = ?, email = ?, profile = ? WHERE name = ?',
        [newUsername, email, profile, username],
        (err, results) => {
          if (err) {
            console.error('更新失败:', err);
            return res.status(500).json({ success: false, message: '更新失败' });
          }
          if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '用户未找到' });
          }
          res.status(200).json({ success: true, message: '用户信息更新成功' });
        }
      );
    }
  );
});

// 获取当前用户参与的学习计划
app.get('/api/user-plans', (req, res) => {
  const username = req.query.username; // 从查询参数中获取用户名

  // 检查用户名是否为空
  if (!username) {
    return res.status(400).json({ success: false, message: '用户名不能为空' });
  }

  // 查询用户参与的学习计划
  pool.query(
    `SELECT 
       id, 
       title, 
       creator, 
       description, 
       DATE_FORMAT(date, '%Y-%m-%d') AS date, 
       address 
     FROM plans 
     WHERE creator = ?`, 
    [username],
    (err, results) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ success: false, message: '查询失败' });
      }

      // 返回学习计划
      res.status(200).json({ success: true, plans: results });
    }
  );
});

// 获取当前用户发布的讨论主题
app.get('/api/user-topics', (req, res) => {
  const username = req.query.username; // 从查询参数中获取用户名

  // 检查用户名是否为空
  if (!username) {
    return res.status(400).json({ success: false, message: '用户名不能为空' });
  }

  // 查询用户发布的讨论主题
  pool.query(
    `SELECT 
       id, 
       title, 
       creator, 
       description, 
       DATE_FORMAT(date, '%Y-%m-%d') AS date 
     FROM discuss 
     WHERE creator = ?`,
    [username],
    (err, results) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ success: false, message: '查询失败' });
      }

      // 返回讨论主题
      res.status(200).json({ success: true, topics: results });
    }
  );
});

// 获取最新的三个学习计划
app.get('/api/latest-plans', (req, res) => {
  pool.query(
    `SELECT 
       id, 
       title, 
       creator, 
       description, 
       DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') AS date, 
       address 
     FROM plans 
     ORDER BY date DESC 
     LIMIT 3`,
    (err, results) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ success: false, message: '查询失败' });
      }

      // 返回最新的三个学习计划
      res.status(200).json({ success: true, plans: results });
    }
  );
});

// 根据关键词搜索学习计划
app.get('/api/search-plans', (req, res) => {
  const keyword = req.query.keyword; // 从查询参数中获取关键词

  // 检查关键词是否为空
  if (!keyword) {
    return res.status(400).json({ success: false, message: '关键词不能为空' });
  }

  // 查询匹配的学习计划
  pool.query(
    `SELECT 
     id, 
     title, 
     creator, 
     description, 
     DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') AS date, 
     address 
   FROM plans 
   WHERE title LIKE ? OR 
         creator LIKE ? OR 
         description LIKE ? OR 
         DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') LIKE ? OR 
         address LIKE ?
   ORDER BY date DESC`,
  [
    `%${keyword}%`, // 对应 title LIKE ?
    `%${keyword}%`, // 对应 creator LIKE ?
    `%${keyword}%`, // 对应 description LIKE ?
    `%${keyword}%`, // 对应 date LIKE ?
    `%${keyword}%`, // 对应 address LIKE ?
  ],
    (err, results) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ success: false, message: '查询失败' });
      }

      // 返回匹配的学习计划
      res.status(200).json({ success: true, plans: results });
    }
  );
});

// ---------------------------------------------------------------------------------------------------------------1
// 获取所有学习计划
app.get('/api/plans', (req, res) => {
  pool.query(
    `SELECT 
       id, 
       title, 
       creator, 
       description, 
       DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') AS date, 
       address 
     FROM plans 
     ORDER BY date DESC`,
    (err, results) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ success: false, message: '查询失败' });
      }
      res.status(200).json(results);
    }
  );
});
// 添加新建计划的路由
app.post('/api/plans', (req, res) => {
  const { title, description, address, creator, type_id } = req.body;
  
  if (!title || !type_id) {
    return res.status(400).json({ success: false, message: '标题和类型不能为空' });
  }
  
  pool.query(
    'INSERT INTO plans (title, description, address, creator, type_id) VALUES (?, ?, ?, ?, ?)',
    [title, description, address, creator, type_id],
    (err, results) => {
      if (err) {
        console.error('添加计划失败:', err);
        return res.status(500).json({ success: false, message: '添加计划失败' });
      }
      res.status(201).json({ success: true, id: results.insertId });
    }
  );
});

// 获取单个学习计划详情
app.get('/api/plan/:id', (req, res) => {
  const planId = req.params.id;
  
  if (planId === 'new') {
    return res.status(200).json({
      id: 'new',
      title: '',
      creator: '',
      description: '',
      date: new Date().toISOString(),
      address: '',
      type: '未分类'
    });
  }
  
  // 添加类型表关联查询
 pool.query(
   `SELECT 
     p.id, 
     p.title, 
     p.creator, 
     p.description, 
     DATE_FORMAT(p.date, '%Y-%m-%d %H:%i:%s') AS date, 
     p.address,
     p.type_id,
     t.name AS type_name 
   FROM plans p
   LEFT JOIN plan_types t ON p.type_id = t.id -- 关联类型表
   WHERE p.id = ?`,
    [planId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: '查询失败' });
      }
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: '计划未找到' });
      }

      //正确定义 responseData
      const responseData = { 
        ...results[0], 
        type: results[0].type_name || '未分类' // 处理空类型
      };
      // console.log('查询结果:', results);
      // console.log('结果中是否有type字段:', results[0].type);
      // console.log('即将返回的数据:', responseData);     
      res.status(200).json(responseData);
    }
  );
});

// 获取计划的评论
app.get('/api/plan/:id/comments', (req, res) => {
  const planId = req.params.id;
  
  pool.query(
    `SELECT 
       id, 
       user, 
       comment, 
       DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') AS date
     FROM plans_comments
     WHERE plan_id = ?
     ORDER BY date DESC`,
    [planId],
    (err, results) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ success: false, message: '查询失败' });
      }
      
      res.status(200).json(results);
    }
  );
});

// 添加评论
app.post('/api/plan/:id/comment', (req, res) => {
  const planId = req.params.id;
  const { user, comment } = req.body;
  
  if (!user || !comment) {
    return res.status(400).json({ success: false, message: '用户和评论内容不能为空' });
  }
  
  pool.query(
    'INSERT INTO plans_comments (plan_id, user, comment, date) VALUES (?, ?, ?, NOW())',
    [planId, user, comment],
    (err, results) => {
      if (err) {
        console.error('添加评论失败:', err);
        return res.status(500).json({ success: false, message: '添加评论失败' });
      }
      
      // 返回新添加的评论
      pool.query(
        `SELECT 
           id, 
           user, 
           comment, 
           DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') AS date
         FROM plans_comments
         WHERE id = ?`,
        [results.insertId],
        (err, commentResult) => {
          if (err) {
            console.error('查询评论失败:', err);
            return res.status(500).json({ success: false, message: '查询评论失败' });
          }
          
          res.status(201).json(commentResult[0]);
        }
      );
    }
  );
});

// 更新学习计划
app.put('/api/plan/:id', async (req, res) => {
  try {
    console.log('=== 开始处理更新计划请求 ===');
    const planId = req.params.id;
    const { title, description, address, currentUser } = req.body;

    // 验证必填字段
    if (!title || !currentUser) {
      return res.status(400).json({ 
        success: false, 
        message: '标题和当前用户不能为空' 
      });
    }

    // 使用Promise和async/await改进错误处理
    const [planRows] = await pool.promise().query(
      'SELECT creator FROM plans WHERE id = ?', 
      [planId]
    );

    if (planRows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: '计划未找到' 
      });
    }

    if (planRows[0].creator !== currentUser) {
      return res.status(403).json({ 
        success: false, 
        message: '无权修改此计划' 
      });
    }

    // 执行更新
    const [result] = await pool.promise().query(
      `UPDATE plans 
       SET title = ?, description = ?, address = ?
       WHERE id = ?`,
      [title, description, address, planId]
    );

    console.log('更新结果:', result);

    if (result.affectedRows === 0) {
      return res.status(500).json({ 
        success: false, 
        message: '更新失败，影响行数为0' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: '更新成功' 
    });

  } catch (err) {
    console.error('服务器错误详情:', err);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误: ' + err.message 
    });
  }
});

// 删除学习计划
app.delete('/api/plan/:id', (req, res) => {
  const planId = req.params.id;
  
  // 先删除相关评论
  pool.query(
    'DELETE FROM plans_comments WHERE plan_id = ?',
    [planId],
    (err) => {
      if (err) {
        console.error('删除评论失败:', err);
        return res.status(500).json({ success: false, message: '删除评论失败' });
      }
      
      // 再删除计划
      pool.query(
        'DELETE FROM plans WHERE id = ?',
        [planId],
        (err, results) => {
          if (err) {
            console.error('删除失败:', err);
            return res.status(500).json({ success: false, message: '删除失败' });
          }
          
          if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '计划未找到' });
          }
          
          res.status(200).json({ success: true, message: '删除成功' });
        }
      );
    }
  );
});
//-------------------------------------------------------------------------------------------------------------------------------2
// 确保上传目录存在
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 文件上传接口
app.post('/api/upload-file', async (req, res) => {
  try {
    if (!req.files?.file) {
      return res.status(400).json({ success: false, message: '未上传文件' });
    }

    const file = req.files.file;
    const { planId, currentUser } = req.body;

    // 生成安全文件名
    const ext = path.extname(file.name);
    const safeFileName = `temp_${Date.now()}${ext}`;
    const uploadPath = path.join('public/uploads', safeFileName);

    // 移动文件
    await file.mv(uploadPath);
    
    // 返回相对路径
    const relativePath = `/uploads/${safeFileName}`;
    
    res.json({ 
      success: true, 
      filePath: relativePath 
    });

  } catch (err) {
    console.error('上传错误:', err);
    res.status(500).json({ 
      success: false, 
      message: `上传失败: ${err.message}` 
    });
  }
});
//------------------------------------------------------------------------------------------------------3
// 获取所有讨论主题
app.get('/api/discuss', (req, res) => {
  pool.query(
    `SELECT 
       id, 
       title, 
       creator, 
       description, 
       DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') AS date
     FROM discuss 
     ORDER BY date DESC`,
    (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, message: '查询失败' });
      }
      res.status(200).json(results);
    }
  );
});

// 获取单个讨论主题详情
app.get('/api/discuss/:id', (req, res) => {
  const id = req.params.id;
  console.log('获取讨论主题详情，ID:', id);

  // 分两步查询：先查主题，再查评论
  pool.query(
    `SELECT 
       d.id, 
       d.title, 
       d.creator, 
       d.description, 
       DATE_FORMAT(d.date, '%Y-%m-%d %H:%i:%s') AS date,
       t.name AS type_name
     FROM discuss d
     LEFT JOIN plan_types t ON d.type_id = t.id
     WHERE d.id = ?`,
    [id],
    (err, topicResults) => {
      if (err) {
        console.error('查询主题失败:', err);
        return res.status(500).json({ success: false, message: '查询失败' });
      }

      if (topicResults.length === 0) {
        return res.status(404).json({ success: false, message: '主题不存在' });
      }

      // 查询评论
      pool.query(
        `SELECT 
           c.id, 
           c.user, 
           c.comment, 
           DATE_FORMAT(c.date, '%Y-%m-%d %H:%i:%s') AS date
         FROM discuss_comments c
         WHERE c.discuss_id = ?
         ORDER BY c.date DESC`,
        [id],
        (err, commentResults) => {
          if (err) {
            console.error('查询评论失败:', err);
            return res.status(500).json({ success: false, message: '查询评论失败' });
          }

          // 合并主题和评论数据
          const topic = {
            ...topicResults[0],
            comments: commentResults // 直接返回评论数组，无需 JSON 解析
          };
          res.status(200).json(topic);
        }
      );
    }
  );
});

// 创建新讨论主题
app.post('/api/discuss', async (req, res) => {
  try {
    const { title, description, creator, type_id } = req.body;
    
    if (!title || !creator || !type_id) {
      return res.status(400).json({ success: false, message: '标题、创建者和类型不能为空' });
    }

    const [result] = await pool.promise().query(
      `INSERT INTO discuss 
       (title, creator, description, date, type_id) 
       VALUES (?, ?, ?, NOW(), ?)`,
      [title, creator, description, type_id]
    );

    res.status(201).json({ 
      success: true, 
      id: result.insertId,
      message: '主题创建成功' 
    });
  } catch (err) {
    console.error('创建主题失败:', err);
    res.status(500).json({ 
      success: false, 
      message: '创建主题失败: ' + err.message 
    });
  }
});

// 添加评论
app.post('/api/discuss/:id/comment', (req, res) => {
  const topicId = req.params.id;
  const { user, comment } = req.body;
  
  if (!user || !comment) {
    return res.status(400).json({ success: false, message: '用户和评论内容不能为空' });
  }
  
  pool.query(
    'INSERT INTO discuss_comments (discuss_id, user, comment, date) VALUES (?, ?, ?, NOW())',
    [topicId, user, comment],
    (err, results) => {
      if (err) {
        console.error('添加评论失败:', err);
        return res.status(500).json({ success: false, message: '添加评论失败' });
      }
      
      // 返回新添加的评论
      pool.query(
        `SELECT 
           id, 
           user, 
           comment, 
           DATE_FORMAT(date, '%Y-%m-%d %H:%i:%s') AS date
         FROM discuss_comments
         WHERE id = ?`,
        [results.insertId],
        (err, commentResult) => {
          if (err) {
            console.error('查询评论失败:', err);
            return res.status(500).json({ success: false, message: '查询评论失败' });
          }
          
          res.status(201).json(commentResult[0]);
        }
      );
    }
  );
});

//--------------------------------------------------------------------------------------------------------------4
// 获取所有用户列表
app.get('/api/admin/users', (req, res) => {
  pool.query(
    `SELECT 
       id,
       name AS username,
       email, 
       profile, 
       DATE_FORMAT(createdate, '%Y-%m-%d %H:%i:%s') AS createdate,
       is_banned
     FROM user_table`,
    (err, results) => {
      if (err) {
        console.error('获取用户列表失败:', err);
        return res.status(500).json({ success: false, message: '获取用户列表失败' });
      }
      res.status(200).json({ success: true, users: results });
    }
  );
});

// 封禁/解封用户
app.put('/api/admin/users/:username/ban', (req, res) => {
  const { username } = req.params;
  const { action } = req.body; // 'ban' 或 'unban'

  if (!['ban', 'unban'].includes(action)) {
    return res.status(400).json({ success: false, message: '无效的操作类型' });
  }

  pool.query(
    'UPDATE user_table SET is_banned = ? WHERE name = ?',  // 使用name而不是username
    [action === 'ban' ? 1 : 0, username],
    (err, results) => {
      if (err) {
        console.error('更新用户状态失败:', err);
        return res.status(500).json({ success: false, message: '更新用户状态失败' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: '用户未找到' });
      }
      res.status(200).json({ 
        success: true, 
        message: `用户${action === 'ban' ? '已封禁' : '已解封'}` 
      });
    }
  );
});

// 获取所有学习计划（带分页）
app.get('/api/admin/plans', (req, res) => {
  const { page = 1, pageSize = 10, search = '' } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `SELECT 
    p.id,
    p.title,
    p.creator,
    p.description,
    DATE_FORMAT(p.date, '%Y-%m-%d %H:%i:%s') AS date,
    p.address,
    COUNT(pc.id) AS comment_count
  FROM plans p
  LEFT JOIN plans_comments pc ON p.id = pc.plan_id`;
  
  let countQuery = 'SELECT COUNT(*) AS total FROM plans';
  
  const params = [];
  const countParams = [];
  
  if (search) {
    query += ' WHERE p.title LIKE ? OR p.creator LIKE ? OR p.description LIKE ?';
    countQuery += ' WHERE title LIKE ? OR creator LIKE ? OR description LIKE ?';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
    countParams.push(searchTerm, searchTerm, searchTerm);
  }
  
  query += ' GROUP BY p.id ORDER BY p.date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  pool.query(countQuery, countParams, (err, countResult) => {
    if (err) {
      console.error('获取总数失败:', err);
      return res.status(500).json({ success: false });
    }
    
    const total = countResult[0].total;
    
    pool.query(query, params, (err, results) => {
      if (err) {
        console.error('获取计划失败:', err);
        return res.status(500).json({ success: false });
      }
      
      res.json({
        success: true,
        plans: results,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    });
  });
});

// 删除学习计划
app.delete('/api/admin/plans/:id', (req, res) => {
  const planId = req.params.id;
  
  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ success: false, message: '获取连接失败' });
    
    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        return res.status(500).json({ success: false, message: '开始事务失败' });
      }
      
      // 删除评论
      connection.query('DELETE FROM plans_comments WHERE plan_id = ?', [planId], (err) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ success: false, message: '删除评论失败' });
          });
        }
        
        // 删除计划
        connection.query('DELETE FROM plans WHERE id = ?', [planId], (err, result) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ success: false, message: '删除计划失败' });
            });
          }
          
          connection.commit(err => {
            connection.release();
            
            if (err) {
              return res.status(500).json({ success: false, message: '提交事务失败' });
            }
            
            res.json({ success: true, affectedRows: result.affectedRows });
          });
        });
      });
    });
  });
});

// 获取学习计划的评论
app.get('/api/admin/plans/:planId/comments', (req, res) => {
  const { planId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  // 获取评论总数
  pool.query(
    'SELECT COUNT(*) AS total FROM plans_comments WHERE plan_id = ?',
    [planId],
    (err, countResult) => {
      if (err) {
        console.error('获取评论总数失败:', err);
        return res.status(500).json({ success: false });
      }

      // 获取评论数据
      pool.query(
        `SELECT 
           pc.id,
           pc.user,
           pc.comment,
           DATE_FORMAT(pc.date, '%Y-%m-%d %H:%i:%s') AS date,
           p.title AS plan_title
         FROM plans_comments pc
         JOIN plans p ON pc.plan_id = p.id
         WHERE pc.plan_id = ?
         ORDER BY pc.date DESC
         LIMIT ? OFFSET ?`,
        [planId, parseInt(pageSize), offset],
        (err, results) => {
          if (err) {
            console.error('获取评论失败:', err);
            return res.status(500).json({ success: false });
          }

          res.json({
            success: true,
            comments: results,
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              total: countResult[0].total,
              totalPages: Math.ceil(countResult[0].total / pageSize)
            }
          });
        }
      );
    }
  );
});

// 批量删除评论
app.delete('/api/admin/comments/batch', (req, res) => {
  const { commentIds } = req.body;
  
  if (!commentIds || !Array.isArray(commentIds) ){
    return res.status(400).json({ success: false, message: '无效的评论ID列表' });
  }

  pool.query(
    'DELETE FROM plans_comments WHERE id IN (?)',
    [commentIds],
    (err, result) => {
      if (err) {
        console.error('批量删除评论失败:', err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true, deletedCount: result.affectedRows });
    }
  );
});

// 删除单个评论
app.delete('/api/admin/comments/:commentId', (req, res) => {
  const { commentId } = req.params;
  
  pool.query(
    'DELETE FROM plans_comments WHERE id = ?',
    [commentId],
    (err, result) => {
      if (err) {
        console.error('删除评论失败:', err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true, deletedCount: result.affectedRows });
    }
  );
});

// 获取所有讨论主题（带分页）
app.get('/api/admin/topics', (req, res) => {
  const { page = 1, pageSize = 10, search = '' } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `SELECT 
    d.id,
    d.title,
    d.creator,
    d.description,
    DATE_FORMAT(d.date, '%Y-%m-%d %H:%i:%s') AS date,
    COUNT(dc.id) AS comment_count
  FROM discuss d
  LEFT JOIN discuss_comments dc ON d.id = dc.discuss_id`;
  
  let countQuery = 'SELECT COUNT(*) AS total FROM discuss';
  
  const params = [];
  const countParams = [];
  
  if (search) {
    query += ' WHERE d.title LIKE ? OR d.creator LIKE ? OR d.description LIKE ?';
    countQuery += ' WHERE title LIKE ? OR creator LIKE ? OR description LIKE ?';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
    countParams.push(searchTerm, searchTerm, searchTerm);
  }
  
  query += ' GROUP BY d.id ORDER BY d.date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  pool.query(countQuery, countParams, (err, countResult) => {
    if (err) {
      console.error('获取总数失败:', err);
      return res.status(500).json({ success: false });
    }
    
    const total = countResult[0].total;
    
    pool.query(query, params, (err, results) => {
      if (err) {
        console.error('获取讨论主题失败:', err);
        return res.status(500).json({ success: false });
      }
      
      res.json({
        success: true,
        topics: results,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    });
  });
});

// 删除讨论主题
app.delete('/api/admin/topics/:id', (req, res) => {
  const topicId = req.params.id;
  
  pool.getConnection((err, connection) => {
    if (err) return res.status(500).json({ success: false, message: '获取连接失败' });
    
    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        return res.status(500).json({ success: false, message: '开始事务失败' });
      }
      
      // 删除评论
      connection.query('DELETE FROM discuss_comments WHERE discuss_id = ?', [topicId], (err) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).json({ success: false, message: '删除评论失败' });
          });
        }
        
        // 删除主题
        connection.query('DELETE FROM discuss WHERE id = ?', [topicId], (err, result) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ success: false, message: '删除主题失败' });
            });
          }
          
          connection.commit(err => {
            connection.release();
            
            if (err) {
              return res.status(500).json({ success: false, message: '提交事务失败' });
            }
            
            res.json({ success: true, affectedRows: result.affectedRows });
          });
        });
      });
    });
  });
});

// 获取讨论主题的评论
app.get('/api/admin/topics/:topicId/comments', (req, res) => {
  const { topicId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  // 获取评论总数
  pool.query(
    'SELECT COUNT(*) AS total FROM discuss_comments WHERE discuss_id = ?',
    [topicId],
    (err, countResult) => {
      if (err) {
        console.error('获取评论总数失败:', err);
        return res.status(500).json({ success: false });
      }

      // 获取评论数据
      pool.query(
        `SELECT 
           dc.id,
           dc.user,
           dc.comment,
           DATE_FORMAT(dc.date, '%Y-%m-%d %H:%i:%s') AS date,
           d.title AS topic_title
         FROM discuss_comments dc
         JOIN discuss d ON dc.discuss_id = d.id
         WHERE dc.discuss_id = ?
         ORDER BY dc.date DESC
         LIMIT ? OFFSET ?`,
        [topicId, parseInt(pageSize), offset],
        (err, results) => {
          if (err) {
            console.error('获取评论失败:', err);
            return res.status(500).json({ success: false });
          }

          res.json({
            success: true,
            comments: results,
            pagination: {
              page: parseInt(page),
              pageSize: parseInt(pageSize),
              total: countResult[0].total,
              totalPages: Math.ceil(countResult[0].total / pageSize)
            }
          });
        }
      );
    }
  );
});

// 批量删除讨论主题评论
app.delete('/api/admin/topic-comments/batch', (req, res) => {
  const { commentIds } = req.body;
  
  if (!commentIds || !Array.isArray(commentIds) ){
    return res.status(400).json({ success: false, message: '无效的评论ID列表' });
  }

  pool.query(
    'DELETE FROM discuss_comments WHERE id IN (?)',
    [commentIds],
    (err, result) => {
      if (err) {
        console.error('批量删除评论失败:', err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true, deletedCount: result.affectedRows });
    }
  );
});

// 删除单个讨论主题评论
app.delete('/api/admin/topic-comments/:commentId', (req, res) => {
  const { commentId } = req.params;
  
  pool.query(
    'DELETE FROM discuss_comments WHERE id = ?',
    [commentId],
    (err, result) => {
      if (err) {
        console.error('删除评论失败:', err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true, deletedCount: result.affectedRows });
    }
  );
});
//-----------------------------------------------------------------------------------------------------------------------------5
// 获取所有类型
app.get('/api/types', (req, res) => {
  pool.query('SELECT * FROM plan_types ORDER BY name', (err, results) => {
    if (err) {
      console.error('获取类型失败:', err);
      return res.status(500).json({ success: false, message: '获取类型失败' });
    }
    res.status(200).json({ success: true, types: results });
  });
});

// 添加新类型
app.post('/api/types', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: '类型名称不能为空' });
  }
  
  pool.query(
    'INSERT INTO plan_types (name, description) VALUES (?, ?)',
    [name, description],
    (err, results) => {
      if (err) {
        console.error('添加类型失败:', err);
        return res.status(500).json({ success: false, message: '添加类型失败' });
      }
      res.status(201).json({ success: true, id: results.insertId });
    }
  );
});

// 按类型获取学习计划
app.get('/api/plans-by-type', (req, res) => {
  const { type_id } = req.query;
  
  if (!type_id) {
    return res.status(400).json({ success: false, message: '类型ID不能为空' });
  }
  
  pool.query(
    `SELECT 
       p.id, 
       p.title, 
       p.creator, 
       p.description, 
       DATE_FORMAT(p.date, '%Y-%m-%d %H:%i:%s') AS date, 
       p.address,
       t.name AS type_name
     FROM plans p
     JOIN plan_types t ON p.type_id = t.id
     WHERE p.type_id = ?
     ORDER BY p.date DESC`,
    [type_id],
    (err, results) => {
      if (err) {
        console.error('查询失败:', err);
        return res.status(500).json({ success: false, message: '查询失败' });
      }
      res.status(200).json({ 
        success: true, 
        plans: results,
        type_name: results[0]?.type_name || ''
      });
    }
  );
});

// 按类型获取讨论主题
app.get('/api/discuss-by-type', (req, res) => {
  const { type_id } = req.query;
  let query = `SELECT 
    d.id, 
    d.title, 
    d.creator, 
    d.description, 
    DATE_FORMAT(d.date, '%Y-%m-%d %H:%i:%s') AS date,
    t.name AS type_name 
  FROM discuss d
  LEFT JOIN plan_types t ON d.type_id = t.id`;
  
  const params = [];
  
  if (type_id) {
    query += ' WHERE d.type_id = ?';
    params.push(type_id);
  }
  
  query += ' ORDER BY d.date DESC';
  
  pool.query(query, params, (err, results) => {
    if (err) {
      console.error('查询失败:', err);
      return res.status(500).json({ success: false, message: '查询失败' });
    }
    res.status(200).json(results);
  });
});

// 删除类型
app.delete('/api/types/:id', (req, res) => {
  const typeId = req.params.id;
  
  pool.query(
    'DELETE FROM plan_types WHERE id = ?',
    [typeId],
    (err, results) => {
      if (err) {
        console.error('删除失败:', err);
        return res.status(500).json({ success: false, message: '删除失败' });
      }
      
      if (results.affectedRows === 0) {
        return res.status(404).json({ success: false, message: '类型未找到' });
      }
      
      res.status(200).json({ success: true, message: '删除成功' });
    }
  );
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});