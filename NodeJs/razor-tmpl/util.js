exports.mapPath = function (rootDir, path) {
    if (path[0] !== '~' && path[0] !== '/')
        throw new Error("mapPath(rootDir,path) path需为 ~/xxx/xxx 或 /views/xxx");

    //去掉 ~
    path = path.substring(1);
    return require('path').join(rootDir, path);
}