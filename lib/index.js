const { src, dest, parallel, series, watch } = require("gulp")

// 安装命令：yarn add gulp-load-plugins --dev
// gulp-load-plugins导出的是一个方法，通过这个方法可以得到一个对象，所有的插件都会成为对象上的属性
// 例如 gulp-sass就是plugins.sass，如果是gulp-sass-sass这种类型，就是plugins.sassSass驼峰式
const loadPlugins = require("gulp-load-plugins")
const plugins = loadPlugins()

// 安装命令：yarn add browser-sync --dev
const browserSync = require("browser-sync")
const bs = browserSync.create() // 创建一个开发服务器

// 安装命令：yarn add gulp-htmlmin gulp-uglify gulp-clean-css gulp-if --dev
// 安装压缩html/css/js文件的插件，以及判断类型插件gulp-if

// yarn add gulp-sass --dev，安装gulp-sass的时候，因为它内部会去安装node-sass，node-sass是一个C++的模块
// 它内部会有对C++程序集的依赖，这些二进制的包需要通过国外的站点去下载，可能会下载不下来，我们可以通过淘宝的镜像源去单独为node-sass配置镜像源
// yarn config set sass_binary_site http://cdn.npm.taobao.org/dist/node-sass -g 网上找来的，似乎有用
// const sass = require('gulp-sass')

// 使用gulp-babel转换js文件，安装命令：yarn add gulp-babel @babel/core @babel/preset-env --dev
// const babel = require("gulp-babel")

// 安装模板引擎插件gulp-swig用于处理html文件，安装命令：yarn add gulp-swig --dev
// const swig = require("gulp-swig")

// 安装gulp-imagemin插件用于转换图片，安装命令：yarn add gulp-imagemin --dev
// const imagemin = require("gulp-imagemin")

// 安装del插件，这不是gulp插件，但是可以在gulp中使用，作用是用来转换文件之前清除dist文件
// yarn add del --dev

// 安装gulp-useref插件，将构建注释文件转换
// yarn add gulp-useref --dev

const del = require("del")

const cwd = process.cwd()// 通过cwd获取命令行工作目录
let config = {
  // default config
  build:{
      src: "src",
      dist: "dist",
      public: "public",
      temp: "temp",
      paths: {
          styles: "assets/styles/*.scss",
          scripts: "assets/scripts/*.js",
          pages: "*.html",
          images: "assets/images/**",
          fonts: "assets/fonts/**"
      }
  }
}
try {
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({}, config, loadConfig)
} catch (err) {}

const clean = () => {
    return del([config.build.dist, config.build.temp])
}

const style = () => {
    return src(config.build.paths.styles, { base: config.build.src, cwd: config.build.src}) 
    // cwd约定从拿个目录去搜索文件，因为config.build.paths.styles是"assets/styles/*.scss"，这个路径实在src目录下的所以使用cwd约定搜索目录
            .pipe(plugins.sass({outputStyle: "expanded"}))
            .pipe(dest(config.build.temp))
            .pipe(bs.reload({ stream: true}))// 刷新浏览器
}

const script = () => {
    return src(config.build.paths.scripts, { base: config.build.src, cwd: config.build.src })
            .pipe(plugins.babel({ presets:[require("@babel/preset-env")]})) // 如果这里没有配置presets的话，也是可以转换，但是转换前后几乎没什么区别，也可以通过babelrc文件去配置
            .pipe(dest(config.build.temp))
            .pipe(bs.reload({ stream: true}))
}

const page = () => {
    return src(config.build.paths.pages, { base: config.build.src, cwd: config.build.src })
            .pipe(plugins.swig({data: config.data, defaults:{cache: false}})) // 配置data，就是模板需要的数据，data: data简写为data;配置defaults:{cache: false}，不缓存，不配置可能会修改页面后没有实现更新
            .pipe(dest(config.build.temp))
            .pipe(bs.reload({ stream: true}))
}

const image = () => {
    return src(config.build.paths.images, { base: config.build.src, cwd: config.build.src })
            .pipe(plugins.imagemin())
            .pipe(dest(config.build.dist))
}

// 字体文件其实只需要拷贝过去就好了，但是里面也有svg文件，所以这里也用imagemin转换一下
const font = () => {
    return src(config.build.paths.fonts, { base: config.build.src, cwd: config.build.src })
            .pipe(plugins.imagemin())
            .pipe(dest(config.build.dist))
}

// 处理一些额外的文件
const extra = () => {
    return src('**', { base: config.build.public, cwd: config.build.src })
            .pipe(dest(config.build.dist))
}


// 启动服务
const serve = () => {
    // 通过watch方法监听文件变化，执行任务
    watch(config.build.paths.styles, { cwd: config.build.src },  style)
    watch(config.build.paths.scripts, { cwd: config.build.src }, script)
    watch(config.build.paths.pages, { cwd: config.build.src }, page)
    watch([
        config.build.paths.images,
        config.build.paths.fonts
    ], { cwd: config.build.src}, bs.reload)
    watch('**', {cwd: config.build.public}, bs.reload)

    bs.init({ // 初始化服务器
        notify: false,// 是否显示 右上角browser-sync是否连接服务的提示
        port:2080,// 端口号
        // open:false,// 是否自动打开浏览器
        // files:"dist/**",// 指定dist下面的所有文件发生变化后更新网站内容（只是监听dist目录下）
        server:{
            // baseDir:"dist", // 网站根目录
            // baseDir:["dist", "src", "public"], // 网站根目录
            baseDir:[config.build.temp, config.build.dist, config.build.public], // 网站根目录
            routes: { // routes里面的配置会优先于baseDir
                "/node_modules": "node_modules" // 对于'/node_modules'开头的文件指到同一个目录下，但似乎没有效果
            }
        }
    })
}

// 将node_modules下要引入的文件打包压缩
const useref = () => {
  return src(config.build.paths.pages, {base: config.build.temp, cwd: config.build.temp})
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.', '../'] })) // 由于上面cwd约定了在config.build.temp这个地址，所以这里.就代表temp目录，../.就表示根目录
    // 使用useref会创建一个文件转换流，这个转换流会去把我们代码中的那些构建注释做一个转换
    // 需要配置searchPath参数，告诉useref去哪个文件下找到这个要被操作的文件
    // 例如main.css文件要去dist目录下找，/node_modules之类的文件就要去项目根目录下找
    // 像这种数组形式的参数我们一般将使用多的放在前面，这样在前面找到了就不会往后执行，性能会有一些优化
    .pipe(plugins.if(/\.js$/,plugins.uglify())) 
    .pipe(plugins.if(/\.css$/,plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/,plugins.htmlmin({
      collapseWhitespace:true, // 清除换行符
      minifyCSS: true, // 压缩css
      minifyJS: true // 压缩js
    })))
    .pipe(dest(config.build.dist))
}

// 组合上面的任务
// 因为这些任务并没有什么牵连，可以同时进行，所以使用parallel
// 定义compile处理src目录下的文件
const compile = parallel(style, script, page)

// 定义build处理所有文件
// 因为我们要先删除，再生成，所以要用series串行执行任务
// 上线之前执行的任务
const build = series(
  clean, 
  parallel(
    series(compile, useref),
    extra, 
    image, 
    font,
    )
)

const develop = series(compile, serve)
// yarn gulp build --gulpfile ./node_modules/hu-gulp-demo/lib/index.js --cwd .
// 指定gulpfile文件路径以及工作目录

// 使用yarn link 将cli模块链接全局后，直接使用该 cli，如果不行
// 命令行输入yarn global bin查看yarn的全局变量地址
// 将这个地址添加到环境变量里的系统变量中的Path属性里即可
module.exports = {
    clean,
    compile,
    build,
    serve,
    develop,
    useref
}