
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {

    mode: "production",
    entry: {
        home: {
            import: './components/main/main.component.js'
        },
        room: {
            import: './components/room/room.component.js'
        }
    },
    output: {
        filename: 'js/[name].js',
    },
    module: {
        rules: [
            {
                test: /\.js?/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets : ["@babel/preset-env", "@babel/preset-react"]
                    }
                }
            },
            {
                test: /\.css?/,
                use: [MiniCssExtractPlugin.loader, 'css-loader']
            }
        ]
    },
    optimization:{
        runtimeChunk: 'single',
        splitChunks:{
            chunks:'all'
        }
    },
    plugins: [
        new MiniCssExtractPlugin({"filename":"css/[name].css"}),
        new HtmlWebpackPlugin({
            "publicPath": "/",
            "filename" : "views/home.html",
            "chunks" : ["home"],
            "template" : "./components/template.html"
        }),
        new HtmlWebpackPlugin({
            "publicPath": "../",
            "filename" : "views/room.html",
            "chunks" : ["room"],
            "template" : "./components/template.html"
        })
    ]

}