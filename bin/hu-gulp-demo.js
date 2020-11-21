#!/usr/bin/env node

// 我们可以通过process.argv获取到命令行传入的数据，拿到的是一个数组
// console.log(process.argv);
// argv中前两个数据是固定的，第一个是node.exe，第二个是当前文件(bin/hu-gulp-demo.js)的路径
// 后面的就是我们传入的数据，以空格分割为数组成员

process.argv.push("--cwd")
process.argv.push(process.cwd())
process.argv.push("--gulpfile")
process.argv.push(require.resolve(".."))

require("gulp/bin/gulp")