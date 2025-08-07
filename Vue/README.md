# Vue

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## First 

```sh
npm install
```

### second （You must enter the Vue file）

```sh
npm run dev
```

### The database is using MySQL Workbench 8.0 CE. After installation, change your MySQL configuration in server/index.js

```sh
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
```

### thirdly, run the server under the 'seven' file 

```sh
cd server
node index.js
```
